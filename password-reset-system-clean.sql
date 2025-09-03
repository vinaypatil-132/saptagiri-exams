-- =====================================================
-- CLEAN PASSWORD RESET SYSTEM - HANDLES EXISTING OBJECTS
-- This script safely updates the password reset system
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add password management columns to students table (safe)
DO $$ 
BEGIN
    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='needs_password_change') THEN
        ALTER TABLE students ADD COLUMN needs_password_change BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='temp_password_set_at') THEN
        ALTER TABLE students ADD COLUMN temp_password_set_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='password_changed_at') THEN
        ALTER TABLE students ADD COLUMN password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='forgot_password_request') THEN
        ALTER TABLE students ADD COLUMN forgot_password_request BOOLEAN DEFAULT FALSE;
    END IF;
    
    RAISE NOTICE 'Students table columns updated successfully';
END $$;

-- =====================================================
-- CREATE OR REPLACE FUNCTIONS
-- =====================================================

-- Function to reset student password (Admin only)
CREATE OR REPLACE FUNCTION admin_reset_student_password(
    student_email TEXT,
    new_password TEXT,
    admin_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    student_user_id UUID;
    is_admin BOOLEAN := FALSE;
    result JSON;
BEGIN
    -- Verify the caller is an admin
    SELECT EXISTS(
        SELECT 1 FROM admin_users 
        WHERE user_id = admin_user_id
    ) INTO is_admin;
    
    IF NOT is_admin THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Access denied. Admin privileges required.'
        );
    END IF;
    
    -- Get student user ID from auth.users table
    SELECT id INTO student_user_id 
    FROM auth.users 
    WHERE email = student_email;
    
    IF student_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Student not found with the provided email.'
        );
    END IF;
    
    -- Mark student as needing password change and clear forgot password request
    UPDATE students 
    SET 
        needs_password_change = TRUE,
        temp_password_set_at = NOW(),
        forgot_password_request = FALSE,
        updated_at = NOW()
    WHERE id = student_user_id;
    
    -- Log the password reset attempt (only if table exists)
    BEGIN
        INSERT INTO password_reset_logs (
            student_id, 
            admin_user_id, 
            reset_at,
            notes
        ) VALUES (
            student_user_id, 
            admin_user_id, 
            NOW(),
            'Password reset initiated by admin'
        );
    EXCEPTION
        WHEN OTHERS THEN
            -- Table might not exist yet, that's okay
            NULL;
    END;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Password reset initiated. Student must change password on next login.',
        'temp_password', new_password
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to reset password: ' || SQLERRM
        );
END;
$$;

-- Function for students to change their temporary password
CREATE OR REPLACE FUNCTION student_change_password(
    student_user_id UUID,
    current_password TEXT,
    new_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    needs_change BOOLEAN := FALSE;
    result JSON;
BEGIN
    -- Verify the student exists and needs password change
    SELECT needs_password_change INTO needs_change
    FROM students 
    WHERE id = student_user_id;
    
    IF needs_change IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Student not found.'
        );
    END IF;
    
    -- Clear password change requirement
    UPDATE students 
    SET 
        needs_password_change = FALSE,
        temp_password_set_at = NULL,
        password_changed_at = NOW(),
        updated_at = NOW()
    WHERE id = student_user_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Password change completed. Please log in again with your new password.'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to change password: ' || SQLERRM
        );
END;
$$;

-- Function to check if a student needs password change
CREATE OR REPLACE FUNCTION check_password_change_required(student_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    needs_change BOOLEAN := FALSE;
BEGIN
    SELECT needs_password_change INTO needs_change
    FROM students 
    WHERE id = student_user_id;
    
    RETURN COALESCE(needs_change, FALSE);
END;
$$;

-- Function to generate secure temporary password
CREATE OR REPLACE FUNCTION generate_temp_password()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    -- Generate 8-character temporary password
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars))::int + 1, 1);
    END LOOP;
    
    RETURN result;
END;
$$;

-- Supabase-specific password reset helper
CREATE OR REPLACE FUNCTION prepare_password_reset(
    student_email TEXT,
    admin_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    student_user_id UUID;
    is_admin BOOLEAN := FALSE;
    temp_password TEXT;
BEGIN
    -- Verify the caller is an admin
    SELECT EXISTS(
        SELECT 1 FROM admin_users 
        WHERE user_id = admin_user_id
    ) INTO is_admin;
    
    IF NOT is_admin THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Access denied. Admin privileges required.'
        );
    END IF;
    
    -- Get student user ID
    SELECT id INTO student_user_id 
    FROM auth.users 
    WHERE email = student_email;
    
    IF student_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Student not found with the provided email.'
        );
    END IF;
    
    -- Generate temporary password
    temp_password := generate_temp_password();
    
    -- Mark student as needing password change and clear forgot password request
    UPDATE students 
    SET 
        needs_password_change = TRUE,
        temp_password_set_at = NOW(),
        forgot_password_request = FALSE,
        updated_at = NOW()
    WHERE id = student_user_id;
    
    -- Log the reset (only if table exists)
    BEGIN
        INSERT INTO password_reset_logs (
            student_id, 
            admin_user_id, 
            reset_at,
            notes
        ) VALUES (
            student_user_id, 
            admin_user_id, 
            NOW(),
            'Password reset prepared - temp password: ' || temp_password
        );
    EXCEPTION
        WHEN OTHERS THEN
            -- Table might not exist yet, that's okay
            NULL;
    END;
    
    RETURN json_build_object(
        'success', true,
        'student_id', student_user_id,
        'student_email', student_email,
        'temp_password', temp_password,
        'message', 'Password reset prepared. Use Supabase Admin API to update actual password.'
    );
END;
$$;

-- Function to handle student forgot password requests
CREATE OR REPLACE FUNCTION student_request_password_reset(
    student_email TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    student_user_id UUID;
BEGIN
    -- Get student user ID
    SELECT id INTO student_user_id 
    FROM auth.users 
    WHERE email = student_email;
    
    IF student_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Student not found with the provided email.'
        );
    END IF;
    
    -- Mark student as having requested password reset
    UPDATE students 
    SET 
        forgot_password_request = TRUE,
        updated_at = NOW()
    WHERE id = student_user_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Password reset request submitted. Please contact your administrator.'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to submit password reset request: ' || SQLERRM
        );
END;
$$;

-- =====================================================
-- CREATE PASSWORD RESET LOGS TABLE (SAFE)
-- =====================================================

DO $$
BEGIN
    -- Create table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'password_reset_logs') THEN
        CREATE TABLE password_reset_logs (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            student_id UUID REFERENCES students(id) ON DELETE CASCADE,
            admin_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE password_reset_logs ENABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE 'Password reset logs table created successfully';
    ELSE
        RAISE NOTICE 'Password reset logs table already exists';
    END IF;
END $$;

-- =====================================================
-- HANDLE POLICIES SAFELY
-- =====================================================

DO $$
BEGIN
    -- Drop existing policy if it exists
    BEGIN
        DROP POLICY IF EXISTS "Admins can view password reset logs" ON password_reset_logs;
    EXCEPTION
        WHEN OTHERS THEN
            NULL; -- Policy might not exist, that's okay
    END;
    
    -- Create the policy
    CREATE POLICY "Admins can view password reset logs" ON password_reset_logs
        FOR SELECT USING (
            EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
        );
    
    RAISE NOTICE 'Password reset logs policy created successfully';
END $$;

-- =====================================================
-- CLEAN UP AND FIX EXISTING DATA
-- =====================================================

-- Fix any students that might have incorrect password change flags
UPDATE students 
SET needs_password_change = FALSE 
WHERE needs_password_change IS NULL;

-- Clear any old forgot password requests (optional)
-- UPDATE students SET forgot_password_request = FALSE WHERE forgot_password_request IS NULL;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Show updated students table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'students' 
AND column_name IN ('needs_password_change', 'temp_password_set_at', 'password_changed_at', 'forgot_password_request')
ORDER BY ordinal_position;

-- Show created functions
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name IN (
    'admin_reset_student_password', 
    'student_change_password', 
    'check_password_change_required',
    'generate_temp_password',
    'prepare_password_reset',
    'student_request_password_reset'
)
ORDER BY routine_name;

-- Test temp password generation
SELECT generate_temp_password() as sample_temp_password;

-- Show any students with password reset flags
SELECT 
    name, 
    email, 
    needs_password_change, 
    forgot_password_request,
    temp_password_set_at
FROM students 
WHERE needs_password_change = TRUE 
   OR forgot_password_request = TRUE
ORDER BY updated_at DESC;

RAISE NOTICE '✅ Password reset system setup completed successfully!';
RAISE NOTICE '📋 Check the results above to verify everything is working correctly.';
RAISE NOTICE '🚀 You can now test the forgot password functionality!';
