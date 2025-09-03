import { auth, database, security, utils } from './supabase.js'

// Global variables
let currentUser = null
let userProfile = null

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize security measures
    auth.setupSecurityHandlers()
    security.enableAll()
    
    await checkAuth()
    if (currentUser) {
        await loadDashboard()
    }

    // Password change form handler (DISABLED - will only work if modal exists)
    const form = document.getElementById('passwordChangeForm')
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault()
            
            const currentPassword = document.getElementById('currentPassword').value
            const newPassword = document.getElementById('newPassword').value
            const confirmPassword = document.getElementById('confirmPassword').value
            
            if (newPassword !== confirmPassword) {
                utils.showNotification('New passwords do not match', 'error')
                return
            }
            
            showLoading()
            try {
                const result = await database.changeStudentPassword(currentPassword, newPassword)
                if (!result.success) {
                    throw new Error(result.error)
                }
                
                utils.showNotification('Password changed successfully! Please log in again.', 'success')
                hidePasswordChangeModal()
                
                // Force logout to ensure new session
                setTimeout(async () => {
                    await auth.logout()
                }, 1000)
            } catch (error) {
                console.error('Password change error:', error)
                utils.showNotification(error.message || 'Failed to change password', 'error')
            } finally {
                hideLoading()
            }
        })
    }
})

// Check authentication (NO PASSWORD CHANGE CHECK)
const checkAuth = async () => {
    try {
        const { user, error } = await auth.getCurrentUser()
        if (error || !user) {
            window.location.href = 'index.html'
            return
        }
        
        currentUser = user
        
        // Check if user is admin (redirect if so)
        const isAdmin = await auth.isAdmin()
        if (isAdmin) {
            window.location.href = 'admin.html'
            return
        }
        
        // Get user profile - NO PASSWORD CHECK
        await loadUserProfile()
        
        // REMOVED: All password change checking logic
        console.log('✅ Login successful, proceeding to dashboard (no password checks)')
        
    } catch (error) {
        console.error('Auth error:', error)
        window.location.href = 'index.html'
    }
}

// Load user profile
const loadUserProfile = async () => {
    try {
        const { data, error } = await database.getStudentProfile()
        if (error) throw error
        
        userProfile = data
        updateUserInfo()
        
    } catch (error) {
        console.error('Error loading profile:', error)
        utils.showNotification('Error loading profile', 'error')
    }
}

// Update user information in UI
const updateUserInfo = () => {
    if (userProfile) {
        document.getElementById('studentName').textContent = userProfile.name
        document.getElementById('welcomeName').textContent = userProfile.name
    }
}

// Load dashboard data
const loadDashboard = async () => {
    showLoading()
    
    try {
        await Promise.all([
            loadExams(),
            loadSubmissions(),
            loadResults(),
            loadProfile(),
            updateStats()
        ])
    } catch (error) {
        console.error('Error loading dashboard:', error)
        utils.showNotification('Error loading dashboard data', 'error')
    } finally {
        hideLoading()
    }
}

// Load available exams
const loadExams = async () => {
    try {
        const { data: exams, error } = await database.getExams()
        if (error) throw error
        
        displayExams(exams || [])
        
    } catch (error) {
        console.error('Error loading exams:', error)
        utils.showNotification('Error loading exams', 'error')
    }
}

// Display exams
const displayExams = (exams) => {
    const examsList = document.getElementById('examsList')
    
    if (!exams || exams.length === 0) {
        examsList.innerHTML = `
            <div class="text-center py-8">
                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No Exams Available</h3>
                <p class="text-gray-500">Check back later for new exams.</p>
            </div>
        `
        return
    }
    
    const examsHTML = exams.map(exam => `
        <div class="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-blue-300 transition-all">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h4 class="text-xl font-semibold text-gray-900 mb-2">${exam.title}</h4>
                    <p class="text-gray-600 mb-3">${exam.description || 'No description available'}</p>
                    <div class="flex items-center space-x-4 text-sm text-gray-500">
                        <span class="flex items-center">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            ${exam.duration_minutes} minutes
                        </span>
                        <span class="flex items-center">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            ${exam.total_marks} marks
                        </span>
                    </div>
                </div>
                <button onclick="startExam('${exam.id}')" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    Start Exam
                </button>
            </div>
        </div>
    `).join('')
    
    examsList.innerHTML = examsHTML
}

// Load submissions
const loadSubmissions = async () => {
    try {
        const { data: submissions, error } = await database.getStudentSubmissions()
        if (error) throw error
        
        displaySubmissions(submissions || [])
        
    } catch (error) {
        console.error('Error loading submissions:', error)
        utils.showNotification('Error loading submissions', 'error')
    }
}

// Display submissions
const displaySubmissions = (submissions) => {
    const submissionsList = document.getElementById('submissionsList')
    
    if (!submissions || submissions.length === 0) {
        submissionsList.innerHTML = `
            <div class="text-center py-8">
                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No Submissions Yet</h3>
                <p class="text-gray-500">Start taking exams to see your submissions here.</p>
            </div>
        `
        return
    }
    
    const submissionsHTML = submissions.slice(0, 5).map(submission => {
        const date = new Date(submission.submitted_at).toLocaleDateString()
        const status = submission.is_evaluated ? 'Evaluated' : 'Pending'
        const statusColor = submission.is_evaluated ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        
        return `
            <div class="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div class="flex justify-between items-center">
                    <div>
                        <h4 class="font-semibold text-gray-900">${submission.exams.title}</h4>
                        <p class="text-sm text-gray-600">Submitted: ${date}</p>
                    </div>
                    <span class="px-3 py-1 rounded-full text-xs font-medium ${statusColor}">
                        ${status}
                    </span>
                </div>
            </div>
        `
    }).join('')
    
    submissionsList.innerHTML = submissionsHTML
}

// Load results
const loadResults = async () => {
    try {
        const { data: results, error } = await database.getStudentResults()
        if (error) throw error
        
        displayResults(results || [])
        
    } catch (error) {
        console.error('Error loading results:', error)
        utils.showNotification('Error loading results', 'error')
    }
}

// Display results
const displayResults = (results) => {
    const resultsList = document.getElementById('resultsList')
    
    if (!results || results.length === 0) {
        resultsList.innerHTML = `
            <div class="text-center py-8">
                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No Results Yet</h3>
                <p class="text-gray-500">Complete exams to see your results here.</p>
            </div>
        `
        return
    }
    
    const resultsHTML = results.slice(0, 5).map(result => {
        const date = new Date(result.published_at).toLocaleDateString()
        const percentage = Math.round(result.percentage)
        const gradeColor = percentage >= 80 ? 'bg-green-100 text-green-800' : 
                          percentage >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
        
        return `
            <div class="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="text-lg font-semibold text-gray-900 mb-2">${result.exams.title}</h4>
                        <div class="flex items-center space-x-4 text-sm text-gray-600">
                            <span>Score: ${result.obtained_marks}/${result.total_marks}</span>
                            <span>Date: ${date}</span>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-2xl font-bold text-gray-900 mb-1">${percentage}%</div>
                        <span class="px-3 py-1 rounded-full text-sm font-medium ${gradeColor}">
                            ${result.grade}
                        </span>
                    </div>
                </div>
            </div>
        `
    }).join('')
    
    resultsList.innerHTML = resultsHTML
}

// Load profile
const loadProfile = async () => {
    try {
        const { data: profile, error } = await database.getStudentProfile()
        if (error) throw error
        
        displayProfile(profile)
        
    } catch (error) {
        console.error('Error loading profile:', error)
        utils.showNotification('Error loading profile', 'error')
    }
}

// Display profile
const displayProfile = (profile) => {
    const profileSection = document.getElementById('profileSection')
    if (!profile) return
    
    const joinDate = new Date(profile.created_at).toLocaleDateString()
    
    const profileHTML = `
        <!-- Personal Information Card -->
        <div class="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6">
            <h4 class="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <svg class="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                Personal Information
            </h4>
            
            <div class="space-y-4">
                <div class="flex items-start text-gray-700">
                    <svg class="w-5 h-5 text-gray-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    <div>
                        <div class="font-semibold">${profile.name}</div>
                        <div class="text-sm text-gray-600">Full Name</div>
                    </div>
                </div>
                
                <div class="flex items-start text-gray-700">
                    <svg class="w-5 h-5 text-gray-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                    <div>
                        <div class="font-semibold">${profile.email}</div>
                        <div class="text-sm text-gray-600">Email Address</div>
                    </div>
                </div>
                
                ${profile.phone ? `
                    <div class="flex items-start text-gray-700">
                        <svg class="w-5 h-5 text-gray-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                        </svg>
                        <div>
                            <div class="font-semibold">${profile.phone}</div>
                            <div class="text-sm text-gray-600">Phone Number</div>
                        </div>
                    </div>
                ` : ''}
                
                ${profile.address ? `
                    <div class="flex items-start text-gray-700">
                        <svg class="w-5 h-5 text-gray-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        <span>${profile.address}</span>
                    </div>
                ` : ''}
            </div>
        </div>
        
        <!-- Account Information Card -->
        <div class="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6">
            <h4 class="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <svg class="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Account Status
            </h4>
            
            <div class="space-y-4">
                <div class="flex items-center justify-between">
                    <span class="text-gray-700">Account Type</span>
                    <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">Student</span>
                </div>
                
                <div class="flex items-center justify-between">
                    <span class="text-gray-700">Status</span>
                    <span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                        <div class="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Active
                    </span>
                </div>
                
                <div class="flex items-center justify-between">
                    <span class="text-gray-700">Registration Date</span>
                    <span class="text-gray-900 font-medium">${joinDate}</span>
                </div>
                
                <div class="pt-4 border-t border-green-200">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-green-600 mb-1">
                            🎓
                        </div>
                        <div class="text-sm text-gray-600">
                            Ready for Exams
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
    
    profileSection.innerHTML = profileHTML
}

// Update statistics
const updateStats = async () => {
    try {
        const [exams, submissions, results] = await Promise.all([
            database.getExams(),
            database.getStudentSubmissions(),
            database.getStudentResults()
        ])
        
        const availableExams = exams.data?.length || 0
        const completedExams = submissions.data?.length || 0
        const studentResults = results.data || []
        
        // Calculate average score from results (not filtered by is_evaluated since results table only contains evaluated results)
        let averageScore = 0
        if (studentResults.length > 0) {
            const totalPercentage = studentResults.reduce((sum, result) => sum + result.percentage, 0)
            averageScore = totalPercentage / studentResults.length
        }
        
        // Find best grade
        let bestGrade = '-'
        let bestPercentage = 0
        if (studentResults.length > 0) {
            const bestResult = studentResults.reduce((best, current) => 
                current.percentage > best.percentage ? current : best
            )
            bestGrade = bestResult.grade
            bestPercentage = bestResult.percentage
        }
        
        // Update UI
        document.getElementById('availableExams').textContent = availableExams
        document.getElementById('completedExams').textContent = completedExams
        document.getElementById('averageScore').textContent = `${averageScore.toFixed(1)}%`
        document.getElementById('bestGrade').textContent = bestGrade
        
        // Add tooltips or additional info if needed
        console.log('Stats updated:', {
            availableExams,
            completedExams,
            averageScore: averageScore.toFixed(1),
            bestGrade,
            bestPercentage
        })
        
    } catch (error) {
        console.error('Error updating stats:', error)
    }
}

// Start exam
window.startExam = (examId) => {
    if (confirm('Are you sure you want to start this exam? You cannot pause or restart once begun.')) {
        window.location.href = `exam.html?id=${examId}`
    }
}

// Logout function
window.logout = async () => {
    try {
        const { error } = await auth.logout()
        if (error) throw error
        
        window.location.href = 'index.html'
        
    } catch (error) {
        console.error('Logout error:', error)
        utils.showNotification('Error logging out', 'error')
    }
}

// Show/hide loading
const showLoading = () => {
    document.getElementById('loadingSpinner').classList.remove('hidden')
}

const hideLoading = () => {
    document.getElementById('loadingSpinner').classList.add('hidden')
}

// Modal functions
window.hideNoExamsModal = () => {
    document.getElementById('noExamsModal').classList.add('hidden')
}

// Password change modal functions (DISABLED - but keeping for compatibility)
const showPasswordChangeModal = () => {
    console.log('❌ Password change modal disabled - this should not be called')
    // Modal will not appear
}

const hidePasswordChangeModal = () => {
    console.log('❌ Password change modal hide called - this should not be needed')
    // Do nothing
}
