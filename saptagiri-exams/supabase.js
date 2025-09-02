// Supabase Client Configuration
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// Supabase configuration
const supabaseUrl = 'https://uglblhduhwdswngfyzzc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbGJsaGR1aHdkc3duZ2Z5enpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MTE5NTgsImV4cCI6MjA3MjI4Nzk1OH0.nT61gaqc3OgormYjAkc0dxN7-2N0IZM0P-HMh8pvpYo'

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Security functions
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

  // Disable keyboard shortcuts
  disableKeyboardShortcuts: () => {
    document.addEventListener('keydown', (e) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault()
      }
    })
  },

  // Disable screen switching (Alt+Tab detection)
  disableScreenSwitching: () => {
    let lastFocusTime = Date.now()
    
    window.addEventListener('blur', () => {
      lastFocusTime = Date.now()
    })
    
    window.addEventListener('focus', () => {
      const timeDiff = Date.now() - lastFocusTime
      if (timeDiff > 1000) { // More than 1 second
        // User switched away from window
        alert('Warning: Switching away from exam window is not allowed!')
      }
    })
  },

  // Enable all security measures
  enableAll: () => {
    security.disableRightClick()
    security.disableTextSelection()
    security.disableCopyPaste()
    security.disableKeyboardShortcuts()
    security.disableScreenSwitching()
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
      
      return { data: { ...data, profile }, error: null }
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
      
      return { data: { ...data, admin: adminCheck }, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Logout
  logout: async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error }
    }
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
