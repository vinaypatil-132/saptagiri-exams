# Supabase Setup Guide for Saptagiri Exams

## 1. Database Schema

### Tables to Create in Supabase SQL Editor:

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

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
  options JSONB, -- For multiple choice questions
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
  answers JSONB NOT NULL, -- Store student answers
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
```

## 2. Row Level Security (RLS) Policies

```sql
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
```

## 3. Sample Data

```sql
-- Insert sample exam
INSERT INTO exams (title, description, duration_minutes, total_marks) VALUES
('Computer Fundamentals', 'Basic computer knowledge test', 60, 100);

-- Insert sample questions
INSERT INTO questions (exam_id, question_text, question_type, options, correct_answer, marks) VALUES
('exam-uuid-here', 'What is the full form of CPU?', 'multiple_choice', 
 '["Central Processing Unit", "Computer Personal Unit", "Central Personal Unit", "Computer Processing Unit"]', 
 'Central Processing Unit', 10);

-- Insert admin user (replace with actual user ID after registration)
-- INSERT INTO admin_users (user_id) VALUES ('your-admin-user-id');
```

## 4. Environment Variables

Create a `.env` file in your project root:

```env
VITE_SUPABASE_URL=https://uglblhduhwdswngfyzzc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbGJsaGR1aHdkc3duZ2Z5enpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MTE5NTgsImV4cCI6MjA3MjI4Nzk1OH0.nT61gaqc3OgormYjAkc0dxN7-2N0IZM0P-HMh8pvpYo
```

## 5. Next Steps

1. Run the SQL commands in Supabase SQL Editor
2. Create an admin user account
3. Insert the admin user ID into admin_users table
4. Test the authentication and RLS policies
5. Deploy the frontend application
