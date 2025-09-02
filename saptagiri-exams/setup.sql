-- =====================================================
-- SUPABASE SETUP FOR SAPTAGIRI EXAMS
-- Copy and paste this entire block into Supabase SQL Editor
-- =====================================================

-- Note: auth.users table is managed by Supabase and RLS is enabled by default
-- We don't need to manually enable RLS on auth.users

-- Students table
CREATE TABLE students (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exams table
CREATE TABLE exams (
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
CREATE TABLE questions (
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
CREATE TABLE submissions (
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
CREATE TABLE results (
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
CREATE TABLE admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Students can only access their own data
CREATE POLICY "Students can view own profile" ON students
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Students can update own profile" ON students
  FOR UPDATE USING (auth.uid() = id);

-- Students can view active exams
CREATE POLICY "Students can view active exams" ON exams
  FOR SELECT USING (is_active = true);

-- Students can view questions for active exams
CREATE POLICY "Students can view questions for active exams" ON questions
  FOR SELECT USING (
    exam_id IN (SELECT id FROM exams WHERE is_active = true)
  );

-- Students can only access their own submissions
CREATE POLICY "Students can view own submissions" ON submissions
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own submissions" ON submissions
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Students can only access their own results
CREATE POLICY "Students can view own results" ON results
  FOR SELECT USING (auth.uid() = student_id);

-- Admins can access everything
CREATE POLICY "Admins have full access" ON students FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

CREATE POLICY "Admins have full access" ON exams FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

CREATE POLICY "Admins have full access" ON questions FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

CREATE POLICY "Admins have full access" ON submissions FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

CREATE POLICY "Admins have full access" ON results FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

CREATE POLICY "Admins have full access" ON admin_users FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample exam
INSERT INTO exams (title, description, duration_minutes, total_marks) VALUES
('Computer Fundamentals', 'Basic computer knowledge test for beginners', 60, 100);

-- Get the exam ID for questions
DO $$
DECLARE
    exam_uuid UUID;
BEGIN
    SELECT id INTO exam_uuid FROM exams WHERE title = 'Computer Fundamentals' LIMIT 1;
    
    -- Insert sample questions
    INSERT INTO questions (exam_id, question_text, question_type, options, correct_answer, marks) VALUES
    (exam_uuid, 'What is the full form of CPU?', 'multiple_choice', 
     '["Central Processing Unit", "Computer Personal Unit", "Central Personal Unit", "Computer Processing Unit"]', 
     'Central Processing Unit', 10),
    
    (exam_uuid, 'Which of the following is an input device?', 'multiple_choice',
     '["Monitor", "Printer", "Keyboard", "Speaker"]',
     'Keyboard', 10),
    
    (exam_uuid, 'RAM stands for Random Access Memory', 'true_false',
     NULL, 'true', 10),
    
    (exam_uuid, 'Explain the difference between RAM and ROM in detail.', 'essay',
     NULL, NULL, 20);
END $$;

-- =====================================================
-- DEMO ADMIN SETUP (RUN THIS AFTER CREATING A USER)
-- =====================================================

-- First, create a demo admin user through the website
-- Then uncomment and run this (replace 'your-admin-email@example.com' with actual email):

/*
-- Find the user ID by email
DO $$
DECLARE
    user_uuid UUID;
BEGIN
    SELECT id INTO user_uuid FROM auth.users WHERE email = 'your-admin-email@example.com';
    
    IF user_uuid IS NOT NULL THEN
        -- Insert into admin_users table
        INSERT INTO admin_users (user_id, role) VALUES (user_uuid, 'admin');
        
        -- Also insert into students table for profile
        INSERT INTO students (id, name, email) VALUES (user_uuid, 'Demo Admin', 'your-admin-email@example.com');
        
        RAISE NOTICE 'Admin user created successfully with ID: %', user_uuid;
    ELSE
        RAISE NOTICE 'User not found. Please create the user first through the website.';
    END IF;
END $$;
*/
