-- =====================================================
-- RESET PASSWORD FLAGS FOR CLEAN TESTING
-- Run this if you want to clear all password reset flags
-- =====================================================

-- Clear all password change requirements
UPDATE students 
SET 
    needs_password_change = FALSE,
    forgot_password_request = FALSE,
    temp_password_set_at = NULL
WHERE needs_password_change = TRUE 
   OR forgot_password_request = TRUE;

-- Show the current state
SELECT 
    name, 
    email, 
    needs_password_change, 
    forgot_password_request,
    temp_password_set_at
FROM students 
ORDER BY name;

RAISE NOTICE '✅ All password flags have been reset!';
RAISE NOTICE '🔄 Students can now login normally without password change prompts.';
RAISE NOTICE '📝 Use the forgot password feature to test the admin reset flow.';
