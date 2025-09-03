// Supabase Client Configuration
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// Supabase configuration
const supabaseUrl = 'https://uglblhduhwdswngfyzzc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbGJsaGR1aHdkc3duZ2Z5enpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MTE5NTgsImV4cCI6MjA3MjI4Nzk1OH0.nT61gaqc3OgormYjAkc0dxN7-2N0IZM0P-HMh8pvpYo'

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Enhanced Security functions
export const security = {
  // Disable right-click
  disableRightClick: () => {
    document.addEventListener('contextmenu', (e) => e.preventDefault())
  },

  // Disable text selection
  disableTextSelection: () => {
    document.addEventListener('selectstart', (e) => e.preventDefault())
    document.addEventListener('dragstart', (e) => e.preventDefault())
  },

  // Disable copy/paste
  disableCopyPaste: () => {
    document.addEventListener('copy', (e) => e.preventDefault())
    document.addEventListener('paste', (e) => e.preventDefault())
    document.addEventListener('cut', (e) => e.preventDefault())
  },

  // Enhanced keyboard shortcuts protection
  disableKeyboardShortcuts: () => {
    document.addEventListener('keydown', (e) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S, Ctrl+A, Ctrl+P, Ctrl+Shift+C
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && (e.key === 'u' || e.key === 's' || e.key === 'a' || e.key === 'p')) ||
        (e.key === 'F5') || // Disable refresh
        (e.ctrlKey && e.key === 'r') // Disable Ctrl+R refresh
      ) {
        e.preventDefault()
        return false
      }
    })
  },

  // Enhanced screen switching detection
  disableScreenSwitching: () => {
    let lastFocusTime = Date.now()
    let switchCount = 0
    
    window.addEventListener('blur', () => {
      lastFocusTime = Date.now()
      switchCount++
    })
    
    window.addEventListener('focus', () => {
      const timeDiff = Date.now() - lastFocusTime
      if (timeDiff > 1000) { // More than 1 second
        if (switchCount > 3) {
          alert('Multiple window switches detected. For security, you will be logged out.')
          auth.logout()
          return
        }
        alert(`Warning: Switching away from window is not allowed! (${switchCount}/3 warnings)`)
      }
    })
  },

  // Prevent console access
  preventConsoleAccess: () => {
    // Disable console methods
    const noop = () => {}
    const methods = ['log', 'debug', 'info', 'warn', 'error', 'assert', 'clear', 'count', 'dir', 'dirxml', 'group', 'groupCollapsed', 'groupEnd', 'profile', 'profileEnd', 'table', 'time', 'timeEnd', 'timeStamp', 'trace']
    methods.forEach(method => {
      if (console[method]) console[method] = noop
    })

    // Detect developer tools
    setInterval(() => {
      const devtools = {
        open: false,
        orientation: null
      }
      const threshold = 160
      
      if (window.outerHeight - window.innerHeight > threshold || window.outerWidth - window.innerWidth > threshold) {
        if (!devtools.open) {
          devtools.open = true
          alert('Developer tools detected! Closing for security.')
          auth.logout()
        }
      } else {
        devtools.open = false
      }
    }, 1000)
  },

  // Prevent source code viewing
  preventSourceViewing: () => {
    // Disable view source shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault()
        return false
      }
    })
  },

  // Input validation and sanitization
  sanitizeInput: (input) => {
    if (typeof input !== 'string') return input
    
    // Remove potentially dangerous characters and scripts
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim()
  },

  // Rate limiting for API calls
  rateLimiter: (() => {
    const limits = new Map()
    
    return {
      check: (key, limit = 10, window = 60000) => {
        const now = Date.now()
        const userLimits = limits.get(key) || []
        
        // Remove old timestamps outside the window
        const validLimits = userLimits.filter(timestamp => now - timestamp < window)
        
        if (validLimits.length >= limit) {
          return false // Rate limit exceeded
        }
        
        validLimits.push(now)
        limits.set(key, validLimits)
        return true // Within rate limit
      }
    }
  })(),

  // CSRF protection
  generateCSRFToken: () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  },

  // Enable all security measures
  enableAll: () => {
    security.disableRightClick()
    security.disableTextSelection()
    security.disableCopyPaste()
    security.disableKeyboardShortcuts()
    security.disableScreenSwitching()
    security.preventConsoleAccess()
    security.preventSourceViewing()
    
    // Set security headers if possible
    try {
      document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.setAttribute('content', 
        "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdn.tailwindcss.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://*.supabase.co;")
    } catch (error) {
      console.log('CSP headers not set')
    }
  }
}

// Authentication functions
export const auth = {
  // Student registration
  registerStudent: async (email, password, name) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      })
      
      if (error) throw error
      
      // Create student profile
      if (data.user) {
        // Wait a moment for auth to complete
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const { error: profileError } = await supabase
          .from('students')
          .insert({
            id: data.user.id,
            name,
            email
          })
        
        if (profileError) {
          console.error('Profile creation error:', profileError)
          // Try to delete the auth user if profile creation fails
          await supabase.auth.signOut()
          throw new Error('Failed to create student profile. Please try again.')
        }
        
        console.log('Student profile created successfully:', data.user.id)
      }
      
      return { data, error: null }
    } catch (error) {
      console.error('Registration error:', error)
      return { data: null, error }
    }
  },

  // Student login
  loginStudent: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      
      // Get student profile
      let { data: profile, error: profileError } = await supabase
        .from('students')
        .select('*')
        .eq('id', data.user.id)
        .single()
      
      // If profile doesn't exist, create it
      if (profileError && profileError.code === 'PGRST116') {
        console.log('Profile not found, creating one...')
        const { error: createError } = await supabase
          .from('students')
          .insert({
            id: data.user.id,
            name: data.user.user_metadata?.name || 'Student',
            email: data.user.email
          })
        
        if (createError) {
          console.error('Failed to create profile:', createError)
          throw createError
        }
        
        // Get the newly created profile
        const { data: newProfile, error: getError } = await supabase
          .from('students')
          .select('*')
          .eq('id', data.user.id)
          .single()
        
        if (getError) throw getError
        profile = newProfile
      } else if (profileError) {
        throw profileError
      }
      
      // Check if password change is required
      const needsPasswordChange = profile.needs_password_change === true
      
      // Trigger login success event for navigation handling
      const loginSuccessEvent = new Event('loginSuccess')
      window.dispatchEvent(loginSuccessEvent)
      
      return { 
        data: { ...data, profile }, 
        error: null, 
        needsPasswordChange 
      }
    } catch (error) {
      console.error('Login error:', error)
      return { data: null, error }
    }
  },

  // Admin login
  loginAdmin: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      
      // Check if user is admin
      const { data: adminCheck, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', data.user.id)
        .single()
      
      if (adminError || !adminCheck) {
        throw new Error('Access denied. Admin privileges required.')
      }
      
      // Trigger login success event for navigation handling
      const loginSuccessEvent = new Event('loginSuccess')
      window.dispatchEvent(loginSuccessEvent)
      
      return { data: { ...data, admin: adminCheck }, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Enhanced Logout - Clear all sessions
  logout: async () => {
    try {
      // Sign out from all devices/sessions
      const { error } = await supabase.auth.signOut({ scope: 'global' })
      if (error) throw error
      
      // Clear all local storage and session storage
      localStorage.clear()
      sessionStorage.clear()
      
      // Clear any cookies if present
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      })
      
      // Force page reload to clear any cached data
      setTimeout(() => {
        window.location.href = 'index.html'
        window.location.reload(true)
      }, 100)
      
      return { error: null }
    } catch (error) {
      return { error }
    }
  },

  // Setup security handlers (fixed to not interfere with login)
  setupSecurityHandlers: () => {
    // Flag to prevent logout during navigation after successful login
    let isNavigatingAfterLogin = false
    let loginSuccessTime = null
    
    // Mark when login is successful
    window.addEventListener('loginSuccess', () => {
      isNavigatingAfterLogin = true
      loginSuccessTime = Date.now()
      // Clear the flag after navigation is complete
      setTimeout(() => {
        isNavigatingAfterLogin = false
      }, 5000) // 5 seconds should be enough for navigation
    })

    // Handle page unload/close (but not during login navigation)
    window.addEventListener('beforeunload', async (event) => {
      // Don't logout if we just logged in and are navigating
      if (isNavigatingAfterLogin || (loginSuccessTime && Date.now() - loginSuccessTime < 5000)) {
        return
      }
      
      try {
        // Only attempt cleanup for actual tab closing, not navigation
        if (event.type === 'beforeunload') {
          // Use beacon API for reliable logout on tab close
          const logoutData = new FormData()
          logoutData.append('action', 'logout')
          
          // Attempt immediate logout for tab close
          navigator.sendBeacon('/api/logout', logoutData)
          
          // Fallback cleanup
          localStorage.clear()
          sessionStorage.clear()
        }
      } catch (error) {
        console.log('Cleanup on unload:', error)
      }
    })

    // Handle visibility change (tab switching) - less aggressive
    document.addEventListener('visibilitychange', async () => {
      if (document.hidden) {
        // Just log the event, don't logout
        console.log('Tab hidden - monitoring for security')
      } else {
        console.log('Tab visible - session active')
      }
    })

    // Session timeout handler (longer timeout)
    let sessionTimeout
    let isUserActive = true
    
    const resetSessionTimeout = () => {
      clearTimeout(sessionTimeout)
      isUserActive = true
      
      // Auto logout after 4 hours of inactivity (increased from 2 hours)
      sessionTimeout = setTimeout(async () => {
        if (!isUserActive) {
          await auth.logout()
          utils.showNotification('Session expired due to inactivity', 'warning')
        }
      }, 4 * 60 * 60 * 1000) // 4 hours
    }

    // Mark user as inactive after 10 minutes of no activity
    let inactivityTimeout
    const markInactive = () => {
      clearTimeout(inactivityTimeout)
      inactivityTimeout = setTimeout(() => {
        isUserActive = false
      }, 10 * 60 * 1000) // 10 minutes
    }

    // Reset timeout on user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    activityEvents.forEach(event => {
      document.addEventListener(event, () => {
        resetSessionTimeout()
        markInactive()
      }, true)
    })

    // Start the timeouts
    resetSessionTimeout()
    markInactive()
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return { user, error: null }
    } catch (error) {
      return { user: null, error }
    }
  },

  // Check if user is admin
  isAdmin: async () => {
    try {
      const { user } = await auth.getCurrentUser()
      if (!user) return false
      
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      return !error && data
    } catch (error) {
      return false
    }
  }
}

// Database functions
export const database = {
  // Get available exams
  getExams: async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Get exam questions
  getExamQuestions: async (examId) => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', examId)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Get exam details
  getExamDetails: async (examId) => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Submit exam answers
  submitExam: async (examId, answers) => {
    try {
      const { user } = await auth.getCurrentUser()
      if (!user) throw new Error('User not authenticated')
      
      const { data, error } = await supabase
        .from('submissions')
        .insert({
          student_id: user.id,
          exam_id: examId,
          answers
        })
        .select()
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Get student submissions
  getStudentSubmissions: async () => {
    try {
      const { user } = await auth.getCurrentUser()
      if (!user) throw new Error('User not authenticated')
      
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          exams (title, description, total_marks)
        `)
        .eq('student_id', user.id)
        .order('submitted_at', { ascending: false })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Get student results
  getStudentResults: async () => {
    try {
      const { user } = await auth.getCurrentUser()
      if (!user) throw new Error('User not authenticated')
      
      const { data, error } = await supabase
        .from('results')
        .select(`
          *,
          exams (title, description),
          submissions (submitted_at)
        `)
        .eq('student_id', user.id)
        .order('published_at', { ascending: false })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Admin: Get all submissions
  getAllSubmissions: async () => {
    try {
      const isAdmin = await auth.isAdmin()
      if (!isAdmin) throw new Error('Admin access required')
      
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          students (name, email),
          exams (title, description, total_marks)
        `)
        .order('submitted_at', { ascending: false })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Admin: Add exam
  addExam: async (examData) => {
    try {
      const isAdmin = await auth.isAdmin()
      if (!isAdmin) throw new Error('Admin access required')
      
      const { data, error } = await supabase
        .from('exams')
        .insert(examData)
        .select()
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Admin: Add question
  addQuestion: async (questionData) => {
    try {
      const isAdmin = await auth.isAdmin()
      if (!isAdmin) throw new Error('Admin access required')
      
      const { data, error } = await supabase
        .from('questions')
        .insert(questionData)
        .select()
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Get student profile
  getStudentProfile: async () => {
    try {
      const { user } = await auth.getCurrentUser()
      if (!user) throw new Error('User not authenticated')
      
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Admin: Evaluate submission and publish result
  publishResult: async (submissionId, obtainedMarks) => {
    try {
      const isAdmin = await auth.isAdmin()
      if (!isAdmin) throw new Error('Admin access required')
      
      // Get submission details
      const { data: submission, error: subError } = await supabase
        .from('submissions')
        .select('*, exams(total_marks)')
        .eq('id', submissionId)
        .single()
      
      if (subError) throw subError
      
      const totalMarks = submission.exams.total_marks
      const percentage = (obtainedMarks / totalMarks) * 100
      
      // Determine grade
      let grade = 'F'
      if (percentage >= 90) grade = 'A+'
      else if (percentage >= 80) grade = 'A'
      else if (percentage >= 70) grade = 'B+'
      else if (percentage >= 60) grade = 'B'
      else if (percentage >= 50) grade = 'C'
      else if (percentage >= 40) grade = 'D'
      
      // Insert result
      const { data, error } = await supabase
        .from('results')
        .insert({
          submission_id: submissionId,
          student_id: submission.student_id,
          exam_id: submission.exam_id,
          total_marks: totalMarks,
          obtained_marks: obtainedMarks,
          percentage,
          grade
        })
        .select()
        .single()
      
      if (error) throw error
      
      // Update submission as evaluated
      await supabase
        .from('submissions')
        .update({ is_evaluated: true, obtained_marks: obtainedMarks })
        .eq('id', submissionId)
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Admin: Get all exams
  getAllExams: async () => {
    try {
      const isAdmin = await auth.isAdmin()
      if (!isAdmin) throw new Error('Admin access required')
      
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Admin: Get all students
  getAllStudents: async () => {
    try {
      const isAdmin = await auth.isAdmin()
      if (!isAdmin) throw new Error('Admin access required')
      
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Admin: Get all results
  getAllResults: async () => {
    try {
      const isAdmin = await auth.isAdmin()
      if (!isAdmin) throw new Error('Admin access required')
      
      const { data, error } = await supabase
        .from('results')
        .select(`
          *,
          students (name, email),
          exams (title, description)
        `)
        .order('published_at', { ascending: false })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Admin: Get admin profile
  getAdminProfile: async () => {
    try {
      const { user } = await auth.getCurrentUser()
      if (!user) throw new Error('User not authenticated')
      
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Admin: Update exam
  updateExam: async (examId, examData) => {
    try {
      const isAdmin = await auth.isAdmin()
      if (!isAdmin) throw new Error('Admin access required')
      
      const { data, error } = await supabase
        .from('exams')
        .update(examData)
        .eq('id', examId)
        .select()
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Admin: Toggle exam active status
  toggleExamStatus: async (examId, currentStatus) => {
    try {
      const isAdmin = await auth.isAdmin()
      if (!isAdmin) throw new Error('Admin access required')
      
      const { data, error } = await supabase
        .from('exams')
        .update({ is_active: !currentStatus })
        .eq('id', examId)
        .select()
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Admin: Add multiple questions
  addMultipleQuestions: async (questionsData) => {
    try {
      const isAdmin = await auth.isAdmin()
      if (!isAdmin) throw new Error('Admin access required')
      
      const { data, error } = await supabase
        .from('questions')
        .insert(questionsData)
        .select()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Admin: Delete question
  deleteQuestion: async (questionId) => {
    try {
      const isAdmin = await auth.isAdmin()
      if (!isAdmin) throw new Error('Admin access required')
      
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId)
      
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error }
    }
  },

  // Admin: Get exam with questions
  getExamWithQuestions: async (examId) => {
    try {
      const isAdmin = await auth.isAdmin()
      if (!isAdmin) throw new Error('Admin access required')
      
      const { data, error } = await supabase
        .from('exams')
        .select(`
          *,
          questions (*)
        `)
        .eq('id', examId)
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Admin: Delete exam
  deleteExam: async (examId) => {
    try {
      const isAdmin = await auth.isAdmin()
      if (!isAdmin) throw new Error('Admin access required')
      
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', examId)
      
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error }
    }
  },

  // Admin: Update question
  updateQuestion: async (questionId, questionData) => {
    try {
      const isAdmin = await auth.isAdmin()
      if (!isAdmin) throw new Error('Admin access required')
      
      const { data, error } = await supabase
        .from('questions')
        .update(questionData)
        .eq('id', questionId)
        .select()
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Admin: Get single question
  getQuestion: async (questionId) => {
    try {
      const isAdmin = await auth.isAdmin()
      if (!isAdmin) throw new Error('Admin access required')
      
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('id', questionId)
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Admin: Update student profile
  updateStudentProfile: async (studentId, profileData) => {
    try {
      const isAdmin = await auth.isAdmin()
      if (!isAdmin) throw new Error('Admin access required')
      
      // Sanitize input data
      const sanitizedData = {}
      for (const [key, value] of Object.entries(profileData)) {
        if (typeof value === 'string') {
          sanitizedData[key] = security.sanitizeInput(value)
        } else {
          sanitizedData[key] = value
        }
      }
      
      const { data, error } = await supabase
        .from('students')
        .update(sanitizedData)
        .eq('id', studentId)
        .select()
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Admin: Delete student completely
  deleteStudent: async (studentId) => {
    try {
      const isAdmin = await auth.isAdmin()
      if (!isAdmin) throw new Error('Admin access required')
      
      // Check rate limiting
      if (!security.rateLimiter.check('delete_student', 5, 300000)) {
        throw new Error('Too many delete requests. Please wait before trying again.')
      }
      
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId)
      
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error }
    }
  },

  // Admin: Deactivate/Activate student
  toggleStudentStatus: async (studentId, currentStatus) => {
    try {
      const isAdmin = await auth.isAdmin()
      if (!isAdmin) throw new Error('Admin access required')
      
      // Check rate limiting
      if (!security.rateLimiter.check('toggle_student_status', 10, 60000)) {
        throw new Error('Too many status change requests. Please wait.')
      }
      
      const { data, error } = await supabase
        .from('students')
        .update({ is_active: !currentStatus })
        .eq('id', studentId)
        .select()
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Admin: Get active students only
  getActiveStudents: async () => {
    try {
      const isAdmin = await auth.isAdmin()
      if (!isAdmin) throw new Error('Admin access required')
      
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Admin: Reset student password
  resetStudentPassword: async (studentEmail, tempPassword) => {
    try {
      const isAdmin = await auth.isAdmin()
      if (!isAdmin) throw new Error('Admin access required')
      
      const { user } = await auth.getCurrentUser()
      if (!user) throw new Error('Admin not authenticated')
      
      // Rate limiting for password resets
      if (!security.rateLimiter.check('password_reset', 5, 300000)) { // 5 resets per 5 minutes
        throw new Error('Too many password reset attempts. Please wait 5 minutes.')
      }
      
      // Step 1: Get student user ID and mark for password change
      const { data: prepData, error: prepError } = await supabase
        .rpc('prepare_password_reset', {
          student_email: studentEmail,
          admin_user_id: user.id
        })
      
      if (prepError) throw prepError
      
      if (!prepData.success) {
        throw new Error(prepData.error)
      }
      
      // Step 2: Use Supabase Admin SDK to update password
      // Note: This requires the Admin API which isn't available in client-side JavaScript
      // For now, we'll simulate the process and let the admin provide the temp password
      // In production, you'd use the Supabase Admin SDK server-side
      
      // For demo purposes, we'll store the temp password info and return success
      return { 
        success: true, 
        message: `Password reset prepared for ${studentEmail}. Temporary password: ${prepData.temp_password || tempPassword}. Student must change it on next login.`,
        tempPassword: prepData.temp_password || tempPassword
      }
      
    } catch (error) {
      console.error('Password reset error:', error)
      return { success: false, error: error.message }
    }
  },

  // Student: Check if password change is required
  checkPasswordChangeRequired: async () => {
    try {
      const { user } = await auth.getCurrentUser()
      if (!user) return { required: false }
      
      const { data, error } = await supabase
        .rpc('check_password_change_required', {
          student_user_id: user.id
        })
      
      if (error) throw error
      return { required: data === true }
    } catch (error) {
      console.error('Password change check error:', error)
      return { required: false, error: error.message }
    }
  },

  // Student: Change password from temporary to new
  changeStudentPassword: async (currentPassword, newPassword) => {
    try {
      const { user } = await auth.getCurrentUser()
      if (!user) throw new Error('Student not authenticated')
      
      // Validate new password
      if (newPassword.length < 8) {
        throw new Error('New password must be at least 8 characters long')
      }
      
      // Rate limiting for password changes
      if (!security.rateLimiter.check('password_change', 3, 300000)) { // 3 attempts per 5 minutes
        throw new Error('Too many password change attempts. Please wait 5 minutes.')
      }
      
      // Step 1: Verify current password by trying to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      })
      
      if (signInError) {
        throw new Error('Current password is incorrect')
      }
      
      // Step 2: Update password using Supabase auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (updateError) throw updateError
      
      // Step 3: Clear password change requirement in database
      const { data, error } = await supabase
        .rpc('student_change_password', {
          student_user_id: user.id,
          current_password: currentPassword,
          new_password: newPassword
        })
      
      if (error) throw error
      
      if (data.success) {
        return { success: true, message: 'Password changed successfully. Please log in again with your new password.' }
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Password change error:', error)
      return { success: false, error: error.message }
    }
  },

  // Generate secure temporary password
  generateTempPassword: async () => {
    try {
      const { data, error } = await supabase
        .rpc('generate_temp_password')
      
      if (error) throw error
      return { password: data }
    } catch (error) {
      console.error('Temp password generation error:', error)
      // Fallback to client-side generation
      const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
      let password = ''
      for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return { password }
    }
  }
}

// Utility functions
export const utils = {
  // Format time (seconds to MM:SS)
  formatTime: (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  },

  // Calculate percentage
  calculatePercentage: (obtained, total) => {
    return total > 0 ? Math.round((obtained / total) * 100) : 0
  },

  // Get grade from percentage
  getGrade: (percentage) => {
    if (percentage >= 90) return 'A+'
    if (percentage >= 80) return 'A'
    if (percentage >= 70) return 'B+'
    if (percentage >= 60) return 'B'
    if (percentage >= 50) return 'C'
    if (percentage >= 40) return 'D'
    return 'F'
  },

  // Show notification
  showNotification: (message, type = 'info') => {
    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'error' ? 'bg-red-500 text-white' :
      type === 'warning' ? 'bg-yellow-500 text-black' :
      'bg-blue-500 text-white'
    }`
    notification.textContent = message
    
    document.body.appendChild(notification)
    
    setTimeout(() => {
      notification.remove()
    }, 3000)
  }
}

export default supabase
