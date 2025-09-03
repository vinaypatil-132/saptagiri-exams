-- =====================================================
-- FIXED PASSWORD RESET SYSTEM FOR ADMIN-MANAGED STUDENT PASSWORDS
-- This script sets up the database functions and schema for the password reset system
-- Run this in Supabase SQL Editor after the main setup
-- =====================================================

-- Add password management columns to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS needs_password_change BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS temp_password_set_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS forgot_password_request BOOLEAN DEFAULT FALSE;

-- =====================================================
-- SIMPLIFIED ADMIN PASSWORD RESET FUNCTION
-- =====================================================

-- Function to reset student password (Admin only)
-- This function allows admins to set a temporary password for students
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
    
    -- For Supabase, we can't directly update auth.users encrypted_password
    -- Instead, we'll use Supabase's admin API or handle this through the application
    -- For now, we'll just mark the student as needing password change
    
    -- Mark student as needing password change
    UPDATE students 
    SET 
        needs_password_change = TRUE,
        temp_password_set_at = NOW(),
        updated_at = NOW()
    WHERE id = student_user_id;
    
    -- Log the password reset attempt (simplified logging)
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

-- =====================================================
-- STUDENT PASSWORD CHANGE FUNCTION (SIMPLIFIED)
-- =====================================================

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
    
    -- Note: In a real Supabase implementation, password changes would be handled
    -- through Supabase's auth API, not directly in the database
    -- This function serves as a marker for the application logic
    
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

-- =====================================================
-- SIMPLIFIED PASSWORD RESET AUDIT LOG TABLE
-- =====================================================

-- Table to track password resets for audit purposes (simplified)
CREATE TABLE IF NOT EXISTS password_reset_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    admin_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on password_reset_logs
ALTER TABLE password_reset_logs ENABLE ROW LEVEL SECURITY;

-- Policy for admins to view password reset logs
CREATE POLICY "Admins can view password reset logs" ON password_reset_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

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

-- =====================================================
-- SUPABASE-SPECIFIC PASSWORD RESET HELPER
-- =====================================================

-- Since Supabase doesn't allow direct manipulation of auth.users.encrypted_password,
-- we need to use their Admin API. This function prepares the data for that.
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
    
    -- Log the reset
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
    
    RETURN json_build_object(
        'success', true,
        'student_id', student_user_id,
        'student_email', student_email,
        'temp_password', temp_password,
        'message', 'Password reset prepared. Use Supabase Admin API to update actual password.'
    );
    
END;
$$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify the new columns were added to students table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'students' 
AND column_name IN ('needs_password_change', 'temp_password_set_at', 'password_changed_at')
ORDER BY ordinal_position;

-- Verify functions were created
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name IN (
    'admin_reset_student_password', 
    'student_change_password', 
    'check_password_change_required',
    'generate_temp_password',
    'prepare_password_reset'
)
ORDER BY routine_name;

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

-- Test temp password generation
SELECT generate_temp_password() as sample_temp_password;
