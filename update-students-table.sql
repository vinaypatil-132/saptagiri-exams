-- =====================================================
-- UPDATE STUDENTS TABLE FOR ENHANCED PROFILE MANAGEMENT
-- This script adds phone and address fields to the students table
-- Run this in Supabase SQL Editor after the initial setup
-- =====================================================

-- Add new columns to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

-- Update the updated_at timestamp when students table is modified
CREATE OR REPLACE FUNCTION update_students_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS students_updated_at_trigger ON students;
CREATE TRIGGER students_updated_at_trigger
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_students_updated_at();

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify the columns were added successfully
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;
