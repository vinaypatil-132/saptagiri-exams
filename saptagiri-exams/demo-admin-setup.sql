-- =====================================================
-- DEMO ADMIN SETUP FOR TESTING
-- Run this AFTER you have created a user through the website
-- =====================================================

-- Step 1: First create a user through the website (index.html)
-- Use this email: demo.admin@saptagiri.com
-- Password: DemoAdmin123!

-- Step 2: Run this script to make them an admin
-- Replace 'demo.admin@saptagiri.com' with the email you used

-- Find the user and make them admin
DO $$
DECLARE
    user_uuid UUID;
    user_name TEXT;
BEGIN
    -- Get user details
    SELECT id, raw_user_meta_data->>'name' INTO user_uuid, user_name 
    FROM auth.users 
    WHERE email = 'demo.admin@saptagiri.com';
    
    IF user_uuid IS NOT NULL THEN
        -- Insert into admin_users table
        INSERT INTO admin_users (user_id, role) 
        VALUES (user_uuid, 'admin')
        ON CONFLICT (user_id) DO NOTHING;
        
        -- Insert into students table for profile
        INSERT INTO students (id, name, email) 
        VALUES (user_uuid, COALESCE(user_name, 'Demo Admin'), 'demo.admin@saptagiri.com')
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE '✅ Demo admin user created successfully!';
        RAISE NOTICE 'User ID: %', user_uuid;
        RAISE NOTICE 'Email: demo.admin@saptagiri.com';
        RAISE NOTICE 'Password: DemoAdmin123!';
        RAISE NOTICE 'You can now login to the admin panel!';
    ELSE
        RAISE NOTICE '❌ User not found!';
        RAISE NOTICE 'Please first create a user through the website with email: demo.admin@saptagiri.com';
    END IF;
END $$;

-- =====================================================
-- ALTERNATIVE: Create admin directly (if you prefer)
-- =====================================================

-- Uncomment and run this if you want to create admin directly
/*
-- Create admin user directly (optional)
INSERT INTO admin_users (user_id, role) 
SELECT id, 'admin' 
FROM auth.users 
WHERE email = 'demo.admin@saptagiri.com'
ON CONFLICT (user_id) DO NOTHING;

-- Create student profile
INSERT INTO students (id, name, email)
SELECT id, 'Demo Admin', email
FROM auth.users 
WHERE email = 'demo.admin@saptagiri.com'
ON CONFLICT (id) DO NOTHING;
*/
