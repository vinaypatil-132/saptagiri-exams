-- =====================================================
-- PASSWORD RESET SYSTEM FOR ADMIN-MANAGED STUDENT PASSWORDS
-- This script sets up the database functions and schema for the password reset system
-- Run this in Supabase SQL Editor after the main setup
-- =====================================================

-- Add password management columns to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS needs_password_change BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS temp_password_set_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- =====================================================
-- ADMIN PASSWORD RESET FUNCTION
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
    
    -- Update password in auth.users table
    -- Note: In production, you'd want to use Supabase's admin API
    -- This is a simplified version for demonstration
    UPDATE auth.users 
    SET 
        encrypted_password = crypt(new_password, gen_salt('bf')),
        updated_at = NOW()
    WHERE id = student_user_id;
    
    -- Mark student as needing password change
    UPDATE students 
    SET 
        needs_password_change = TRUE,
        temp_password_set_at = NOW(),
        updated_at = NOW()
    WHERE id = student_user_id;
    
    -- Log the password reset (optional - for audit trail)
    INSERT INTO password_reset_logs (
        student_id, 
        admin_user_id, 
        reset_at
    ) VALUES (
        student_user_id, 
        admin_user_id, 
        NOW()
    );
    
    RETURN json_build_object(
        'success', true,
        'message', 'Password reset successfully. Student must change password on next login.'
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
-- STUDENT PASSWORD CHANGE FUNCTION
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
    is_valid_user BOOLEAN := FALSE;
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
    
    -- Verify current password (simplified - in production use proper auth)
    SELECT EXISTS(
        SELECT 1 FROM auth.users 
        WHERE id = student_user_id 
        AND encrypted_password = crypt(current_password, encrypted_password)
    ) INTO is_valid_user;
    
    IF NOT is_valid_user THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Current password is incorrect.'
        );
    END IF;
    
    -- Update password in auth.users table
    UPDATE auth.users 
    SET 
        encrypted_password = crypt(new_password, gen_salt('bf')),
        updated_at = NOW()
    WHERE id = student_user_id;
    
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
        'message', 'Password changed successfully.'
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
-- PASSWORD RESET AUDIT LOG TABLE
-- =====================================================

-- First, add unique constraint to admin_users.user_id if it doesn't exist
DO $$ BEGIN
    -- Add unique constraint to admin_users.user_id
    BEGIN
        ALTER TABLE admin_users ADD CONSTRAINT admin_users_user_id_unique UNIQUE (user_id);
    EXCEPTION
        WHEN duplicate_table THEN
            -- Constraint already exists
            NULL;
        WHEN others THEN
            -- Handle other errors
            RAISE NOTICE 'Could not add unique constraint to admin_users.user_id: %', SQLERRM;
    END;
END $$;

-- Table to track password resets for audit purposes
CREATE TABLE IF NOT EXISTS password_reset_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    admin_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
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
    'generate_temp_password'
)
ORDER BY routine_name;
