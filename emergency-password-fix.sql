-- =====================================================
-- EMERGENCY PASSWORD CHANGE FIX
-- This will immediately clear all password change requirements
-- =====================================================

-- First, let's see what the current state is
SELECT 
    name, 
    email, 
    needs_password_change, 
    forgot_password_request,
    temp_password_set_at
FROM students 
ORDER BY name;

-- Clear ALL password change requirements immediately
UPDATE students 
SET 
    needs_password_change = FALSE,
    forgot_password_request = FALSE,
    temp_password_set_at = NULL,
    updated_at = NOW()
WHERE needs_password_change = TRUE 
   OR forgot_password_request = TRUE
   OR needs_password_change IS NULL;

-- Ensure all students have proper defaults
UPDATE students 
SET 
    needs_password_change = FALSE,
    forgot_password_request = FALSE
WHERE needs_password_change IS NULL 
   OR forgot_password_request IS NULL;

-- Show the fixed state
SELECT 
    name, 
    email, 
    needs_password_change, 
    forgot_password_request,
    temp_password_set_at,
    updated_at
FROM students 
ORDER BY name;

RAISE NOTICE '🚨 EMERGENCY FIX APPLIED!';
RAISE NOTICE '✅ ALL password change requirements have been cleared.';
RAISE NOTICE '🔄 Students should now login normally WITHOUT password change prompts.';
RAISE NOTICE '📝 Only use admin reset password when actually needed.';
