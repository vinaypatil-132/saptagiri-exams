-- =====================================================
-- ADD STUDENT STATUS MANAGEMENT
-- This script adds is_active field to students table for deactivation
-- Run this in Supabase SQL Editor after the initial setup
-- =====================================================

-- Add is_active column to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing students to be active by default
UPDATE students 
SET is_active = true 
WHERE is_active IS NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_students_active ON students(is_active);

-- Update RLS policies to consider active status
DROP POLICY IF EXISTS "Students can view active exams" ON exams;
CREATE POLICY "Students can view active exams" ON exams
  FOR SELECT USING (
    is_active = true 
    AND EXISTS (
      SELECT 1 FROM students 
      WHERE students.id = auth.uid() 
      AND students.is_active = true
    )
  );

DROP POLICY IF EXISTS "Students can view questions for active exams" ON questions;
CREATE POLICY "Students can view questions for active exams" ON questions
  FOR SELECT USING (
    exam_id IN (SELECT id FROM exams WHERE is_active = true)
    AND EXISTS (
      SELECT 1 FROM students 
      WHERE students.id = auth.uid() 
      AND students.is_active = true
    )
  );

DROP POLICY IF EXISTS "Students can insert own submissions" ON submissions;
CREATE POLICY "Students can insert own submissions" ON submissions
  FOR INSERT WITH CHECK (
    auth.uid() = student_id 
    AND EXISTS (
      SELECT 1 FROM students 
      WHERE students.id = auth.uid() 
      AND students.is_active = true
    )
  );

-- Add trigger to log student status changes
CREATE OR REPLACE FUNCTION log_student_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Log when student is deactivated/activated
    IF OLD.is_active != NEW.is_active THEN
        INSERT INTO admin_logs (action, details, created_at) 
        VALUES (
            CASE 
                WHEN NEW.is_active = false THEN 'student_deactivated'
                ELSE 'student_activated'
            END,
            json_build_object(
                'student_id', NEW.id,
                'student_name', NEW.name,
                'student_email', NEW.email,
                'changed_by', auth.uid()
            ),
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create admin logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger
DROP TRIGGER IF EXISTS student_status_change_trigger ON students;
CREATE TRIGGER student_status_change_trigger
    AFTER UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION log_student_status_change();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if is_active column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'students' AND column_name = 'is_active';

-- Show current student status
SELECT id, name, email, is_active, created_at 
FROM students 
ORDER BY created_at DESC;
