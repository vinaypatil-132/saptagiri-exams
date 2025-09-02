-- =====================================================
-- FIXED SUPABASE SETUP FOR SAPTAGIRI EXAMS
-- This version avoids RLS recursion issues
-- Copy and paste this entire block into Supabase SQL Editor
-- =====================================================

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exams table
CREATE TABLE IF NOT EXISTS exams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  total_marks INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT CHECK (question_type IN ('multiple_choice', 'essay', 'true_false')) NOT NULL,
  options JSONB,
  correct_answer TEXT,
  marks INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_evaluated BOOLEAN DEFAULT false,
  total_marks INTEGER,
  obtained_marks INTEGER
);

-- Results table
CREATE TABLE IF NOT EXISTS results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  total_marks INTEGER NOT NULL,
  obtained_marks INTEGER NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  grade TEXT,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on our custom tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Students can view own profile" ON students;
DROP POLICY IF EXISTS "Students can update own profile" ON students;
DROP POLICY IF EXISTS "Students can view active exams" ON exams;
DROP POLICY IF EXISTS "Students can view questions for active exams" ON questions;
DROP POLICY IF EXISTS "Students can view own submissions" ON submissions;
DROP POLICY IF EXISTS "Students can insert own submissions" ON submissions;
DROP POLICY IF EXISTS "Students can view own results" ON results;
DROP POLICY IF EXISTS "Admins have full access" ON students;
DROP POLICY IF EXISTS "Admins have full access" ON exams;
DROP POLICY IF EXISTS "Admins have full access" ON questions;
DROP POLICY IF EXISTS "Admins have full access" ON submissions;
DROP POLICY IF EXISTS "Admins have full access" ON results;
DROP POLICY IF EXISTS "Admin users can manage admin_users" ON admin_users;
DROP POLICY IF EXISTS "Admins have full access" ON admin_users;

-- =====================================================
-- INITIAL SETUP POLICIES (ALLOW EVERYTHING FOR NOW)
-- =====================================================

-- Allow all operations on all tables initially (for setup)
CREATE POLICY "Allow all operations" ON students FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON exams FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON questions FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON submissions FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON results FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON admin_users FOR ALL USING (true);

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample exam (only if it doesn't exist)
INSERT INTO exams (title, description, duration_minutes, total_marks) 
SELECT 'Computer Fundamentals', 'Basic computer knowledge test for beginners', 60, 100
WHERE NOT EXISTS (SELECT 1 FROM exams WHERE title = 'Computer Fundamentals');

-- Get the exam ID for questions
DO $$
DECLARE
    exam_uuid UUID;
BEGIN
    SELECT id INTO exam_uuid FROM exams WHERE title = 'Computer Fundamentals' LIMIT 1;
    
    -- Insert sample questions (only if they don't exist)
    IF NOT EXISTS (SELECT 1 FROM questions WHERE exam_id = exam_uuid AND question_text LIKE '%CPU%') THEN
        INSERT INTO questions (exam_id, question_text, question_type, options, correct_answer, marks) VALUES
        (exam_uuid, 'What is the full form of CPU?', 'multiple_choice', 
         '["Central Processing Unit", "Computer Personal Unit", "Central Personal Unit", "Computer Processing Unit"]', 
         'Central Processing Unit', 10);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM questions WHERE exam_id = exam_uuid AND question_text LIKE '%input device%') THEN
        INSERT INTO questions (exam_id, question_text, question_type, options, correct_answer, marks) VALUES
        (exam_uuid, 'Which of the following is an input device?', 'multiple_choice',
         '["Monitor", "Printer", "Keyboard", "Speaker"]',
         'Keyboard', 10);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM questions WHERE exam_id = exam_uuid AND question_text LIKE '%RAM stands for%') THEN
        INSERT INTO questions (exam_id, question_text, question_type, options, correct_answer, marks) VALUES
        (exam_uuid, 'RAM stands for Random Access Memory', 'true_false',
         NULL, 'true', 10);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM questions WHERE exam_id = exam_uuid AND question_text LIKE '%difference between RAM and ROM%') THEN
        INSERT INTO questions (exam_id, question_text, question_type, options, correct_answer, marks) VALUES
        (exam_uuid, 'Explain the difference between RAM and ROM in detail.', 'essay',
         NULL, NULL, 20);
    END IF;
    
    RAISE NOTICE 'Sample data inserted successfully for exam: %', exam_uuid;
END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if tables were created
SELECT 'Tables created successfully' as status, 
       (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('students', 'exams', 'questions', 'submissions', 'results', 'admin_users')) as table_count;

-- Check if policies were created
SELECT 'Policies created successfully' as status,
       (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('students', 'exams', 'questions', 'submissions', 'results', 'admin_users')) as policy_count;

-- Check sample data
SELECT 'Sample data inserted' as status,
       (SELECT count(*) FROM exams) as exam_count,
       (SELECT count(*) FROM questions) as question_count;

-- =====================================================
-- NEXT STEPS AFTER SETUP
-- =====================================================

-- After you create your first admin user, run this to enable proper security:
/*
-- Drop the open policies
DROP POLICY "Allow all operations" ON students;
DROP POLICY "Allow all operations" ON exams;
DROP POLICY "Allow all operations" ON questions;
DROP POLICY "Allow all operations" ON submissions;
DROP POLICY "Allow all operations" ON results;
DROP POLICY "Allow all operations" ON admin_users;

-- Create proper restrictive policies
CREATE POLICY "Students can view own profile" ON students FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Students can update own profile" ON students FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Students can view active exams" ON exams FOR SELECT USING (is_active = true);
CREATE POLICY "Students can view questions for active exams" ON questions FOR SELECT USING (exam_id IN (SELECT id FROM exams WHERE is_active = true));
CREATE POLICY "Students can view own submissions" ON submissions FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can insert own submissions" ON submissions FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can view own results" ON results FOR SELECT USING (auth.uid() = student_id);

-- Admin policies (only after admin user exists)
CREATE POLICY "Admins have full access" ON students FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));
CREATE POLICY "Admins have full access" ON exams FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));
CREATE POLICY "Admins have full access" ON questions FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));
CREATE POLICY "Admins have full access" ON submissions FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));
CREATE POLICY "Admins have full access" ON results FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage admin_users" ON admin_users FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));
*/
