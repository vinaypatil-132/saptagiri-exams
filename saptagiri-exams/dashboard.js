import { auth, database, utils } from './supabase.js'

// Global variables
let currentUser = null
let userProfile = null

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth()
    if (currentUser) {
        await loadDashboard()
    }
})

// Check authentication
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
        
        // Get user profile
        await loadUserProfile()
        
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
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No Results Yet</h3>
                <p class="text-gray-500">Your exam results will appear here once evaluated.</p>
            </div>
        `
        return
    }
    
    const resultsHTML = results.map(result => {
        const date = new Date(result.published_at).toLocaleDateString()
        const percentage = result.percentage
        const grade = result.grade
        
        let gradeColor = 'bg-gray-100 text-gray-800'
        if (grade === 'A+' || grade === 'A') gradeColor = 'bg-green-100 text-green-800'
        else if (grade === 'B+' || grade === 'B') gradeColor = 'bg-blue-100 text-blue-800'
        else if (grade === 'C') gradeColor = 'bg-yellow-100 text-yellow-800'
        else if (grade === 'D') gradeColor = 'bg-orange-100 text-orange-800'
        else if (grade === 'F') gradeColor = 'bg-red-100 text-red-800'
        
        return `
            <div class="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div class="flex justify-between items-center mb-4">
                    <div>
                        <h4 class="text-xl font-semibold text-gray-900">${result.exams.title}</h4>
                        <p class="text-sm text-gray-600">Published: ${date}</p>
                    </div>
                    <span class="px-4 py-2 rounded-full text-sm font-bold ${gradeColor}">
                        Grade: ${grade}
                    </span>
                </div>
                <div class="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p class="text-sm text-gray-600">Total Marks</p>
                        <p class="text-2xl font-bold text-gray-900">${result.total_marks}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Obtained</p>
                        <p class="text-2xl font-bold text-blue-600">${result.obtained_marks}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Percentage</p>
                        <p class="text-2xl font-bold text-green-600">${percentage.toFixed(1)}%</p>
                    </div>
                </div>
            </div>
        `
    }).join('')
    
    resultsList.innerHTML = resultsHTML
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
        const evaluatedResults = results.data?.filter(r => r.is_evaluated) || []
        
        // Calculate average score
        let averageScore = 0
        if (evaluatedResults.length > 0) {
            const totalPercentage = evaluatedResults.reduce((sum, result) => sum + result.percentage, 0)
            averageScore = totalPercentage / evaluatedResults.length
        }
        
        // Find best grade
        let bestGrade = '-'
        if (evaluatedResults.length > 0) {
            const bestResult = evaluatedResults.reduce((best, current) => 
                current.percentage > best.percentage ? current : best
            )
            bestGrade = bestResult.grade
        }
        
        // Update UI
        document.getElementById('availableExams').textContent = availableExams
        document.getElementById('completedExams').textContent = completedExams
        document.getElementById('averageScore').textContent = `${averageScore.toFixed(1)}%`
        document.getElementById('bestGrade').textContent = bestGrade
        
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


