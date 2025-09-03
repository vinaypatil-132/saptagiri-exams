<<<<<<< HEAD
import { auth, database, security, utils } from './supabase.js'
=======
import { auth, database, utils } from './supabase.js'
>>>>>>> 4acd36e60b0492681c3a96c0e76eab2890542f8b

// Global variables
let currentUser = null
let adminProfile = null

// Initialize admin panel
document.addEventListener('DOMContentLoaded', async () => {
<<<<<<< HEAD
    // Initialize security measures
    auth.setupSecurityHandlers()
    security.enableAll()
    
=======
>>>>>>> 4acd36e60b0492681c3a96c0e76eab2890542f8b
    await checkAuth()
    if (currentUser) {
        await loadAdminPanel()
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
        
        // Check if user is admin (redirect if not)
        const isAdmin = await auth.isAdmin()
        if (!isAdmin) {
            window.location.href = 'dashboard.html'
            return
        }
        
        // Get admin profile
        await loadAdminProfile()
        
    } catch (error) {
        console.error('Auth error:', error)
        window.location.href = 'index.html'
    }
}

// Load admin profile
const loadAdminProfile = async () => {
    try {
        const { data, error } = await database.getAdminProfile()
        if (error) throw error
        
        adminProfile = data
        updateAdminInfo()
        
    } catch (error) {
        console.error('Error loading profile:', error)
        utils.showNotification('Error loading profile', 'error')
    }
}

// Update admin information in UI
const updateAdminInfo = () => {
    if (adminProfile) {
        document.getElementById('adminName').textContent = adminProfile.name || 'Administrator'
        document.getElementById('welcomeAdminName').textContent = adminProfile.name || 'Administrator'
    }
}

// Load admin panel data
const loadAdminPanel = async () => {
    showLoading()
    
    try {
        await Promise.all([
            loadStats(),
            loadRecentSubmissions(),
<<<<<<< HEAD
            loadExams(),
            loadQuestions(),
            loadStudentsManagement()
=======
            loadExams()
>>>>>>> 4acd36e60b0492681c3a96c0e76eab2890542f8b
        ])
    } catch (error) {
        console.error('Error loading admin panel:', error)
        utils.showNotification('Error loading admin panel data', 'error')
    } finally {
        hideLoading()
    }
}

// Load statistics
const loadStats = async () => {
    try {
        const [exams, students, submissions, results] = await Promise.all([
            database.getAllExams(),
            database.getAllStudents(),
            database.getAllSubmissions(),
            database.getAllResults()
        ])
        
        const totalExams = exams.data?.length || 0
        const totalStudents = students.data?.length || 0
        const pendingEvaluations = submissions.data?.filter(s => !s.is_evaluated).length || 0
        const publishedResults = results.data?.length || 0
        
        // Update UI
        document.getElementById('totalExams').textContent = totalExams
        document.getElementById('totalStudents').textContent = totalStudents
        document.getElementById('pendingEvaluations').textContent = pendingEvaluations
        document.getElementById('publishedResults').textContent = publishedResults
        
    } catch (error) {
        console.error('Error loading stats:', error)
    }
}

// Load recent submissions
const loadRecentSubmissions = async () => {
    try {
        const { data: submissions, error } = await database.getAllSubmissions()
        if (error) throw error
        
        displayRecentSubmissions(submissions?.slice(0, 5) || [])
        
    } catch (error) {
        console.error('Error loading submissions:', error)
        utils.showNotification('Error loading submissions', 'error')
    }
}

// Display recent submissions
const displayRecentSubmissions = (submissions) => {
    const submissionsList = document.getElementById('recentSubmissions')
    
    if (!submissions || submissions.length === 0) {
        submissionsList.innerHTML = `
            <div class="text-center py-8">
                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No Submissions Yet</h3>
                <p class="text-gray-500">Students will appear here once they submit exams.</p>
            </div>
        `
        return
    }
    
    const submissionsHTML = submissions.map(submission => {
        const date = new Date(submission.submitted_at).toLocaleDateString()
        const status = submission.is_evaluated ? 'Evaluated' : 'Pending'
        const statusColor = submission.is_evaluated ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        
        return `
            <div class="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div class="flex justify-between items-center">
                    <div>
                        <h4 class="font-semibold text-gray-900">${submission.students.name}</h4>
                        <p class="text-sm text-gray-600">${submission.exams.title} • ${date}</p>
                    </div>
                    <div class="flex items-center space-x-3">
                        <span class="px-3 py-1 rounded-full text-xs font-medium ${statusColor}">
                            ${status}
                        </span>
                        ${!submission.is_evaluated ? `
                            <button onclick="evaluateSubmission('${submission.id}')" class="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                                Evaluate
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `
    }).join('')
    
    submissionsList.innerHTML = submissionsHTML
}

// Load exams
const loadExams = async () => {
    try {
        const { data: exams, error } = await database.getAllExams()
        if (error) throw error
        
        displayExams(exams || [])
        
    } catch (error) {
        console.error('Error loading exams:', error)
        utils.showNotification('Error loading exams', 'error')
    }
}

<<<<<<< HEAD
// Load questions
const loadQuestions = async () => {
    try {
        const { data: exams, error } = await database.getAllExams()
        if (error) throw error
        
        let allQuestions = []
        for (const exam of exams || []) {
            const { data: questions, error: qError } = await database.getExamQuestions(exam.id)
            if (!qError && questions) {
                const questionsWithExam = questions.map(q => ({ ...q, exam_title: exam.title }))
                allQuestions = allQuestions.concat(questionsWithExam)
            }
        }
        
        displayQuestions(allQuestions)
        
    } catch (error) {
        console.error('Error loading questions:', error)
        utils.showNotification('Error loading questions', 'error')
    }
}

=======
>>>>>>> 4acd36e60b0492681c3a96c0e76eab2890542f8b
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
                <h3 class="text-lg font-medium text-gray-900 mb-2">No Exams Created</h3>
                <p class="text-gray-500">Create your first exam to get started.</p>
            </div>
        `
        return
    }
    
    const examsHTML = exams.map(exam => `
        <div class="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h4 class="text-xl font-semibold text-gray-900 mb-2">${exam.title}</h4>
                    <p class="text-gray-600 mb-3">${exam.description || 'No description'}</p>
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
                        <span class="flex items-center">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            ${exam.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>
<<<<<<< HEAD
                <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
=======
                <div class="flex space-x-2">
>>>>>>> 4acd36e60b0492681c3a96c0e76eab2890542f8b
                    <button onclick="editExam('${exam.id}')" class="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                        Edit
                    </button>
                    <button onclick="toggleExamStatus('${exam.id}', ${exam.is_active})" class="${exam.is_active ? 'bg-yellow-600' : 'bg-green-600'} text-white px-3 py-1 rounded-lg hover:${exam.is_active ? 'bg-yellow-700' : 'bg-green-700'} transition-colors text-sm">
                        ${exam.is_active ? 'Deactivate' : 'Activate'}
                    </button>
<<<<<<< HEAD
                    <button onclick="deleteExam('${exam.id}')" class="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors text-sm">
                        Delete
                    </button>
=======
>>>>>>> 4acd36e60b0492681c3a96c0e76eab2890542f8b
                </div>
            </div>
        </div>
    `).join('')
    
    examsList.innerHTML = examsHTML
}

<<<<<<< HEAD
// Display questions
const displayQuestions = (questions) => {
    const questionsList = document.getElementById('questionsList')
    
    if (!questions || questions.length === 0) {
        questionsList.innerHTML = `
            <div class="text-center py-8">
                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No Questions Created</h3>
                <p class="text-gray-500">Create your first question to get started.</p>
            </div>
        `
        return
    }
    
    const questionsHTML = questions.map(question => {
        const truncatedText = question.question_text.length > 100 ? 
            question.question_text.substring(0, 100) + '...' : question.question_text
        
        return `
            <div class="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex-1">
                        <div class="flex items-center space-x-2 mb-2">
                            <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                ${question.exam_title}
                            </span>
                            <span class="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                                ${question.question_type.replace('_', ' ').toUpperCase()}
                            </span>
                            <span class="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                ${question.marks} marks
                            </span>
                        </div>
                        <p class="text-gray-900 mb-2">${truncatedText}</p>
                    </div>
                    <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 ml-4">
                        <button onclick="editQuestion('${question.id}')" class="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                            Edit
                        </button>
                        <button onclick="deleteQuestion('${question.id}')" class="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors text-sm">
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        `
    }).join('')
    
    questionsList.innerHTML = questionsHTML
}

// Load students management
const loadStudentsManagement = async () => {
    try {
        const { data: students, error } = await database.getAllStudents()
        if (error) throw error
        
        displayStudentsManagement(students || [])
        
    } catch (error) {
        console.error('Error loading students management:', error)
        utils.showNotification('Error loading students management', 'error')
    }
}

// Display students management
const displayStudentsManagement = (students) => {
    const studentsManagementList = document.getElementById('studentsManagementList')
    
    if (!students || students.length === 0) {
        studentsManagementList.innerHTML = `
            <div class="text-center py-8">
                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No Students Registered</h3>
                <p class="text-gray-500">Students will appear here once they register.</p>
            </div>
        `
        return
    }
    
    const studentsHTML = students.map((student, index) => {
        const joinDate = new Date(student.created_at).toLocaleDateString()
        
        return `
            <div class="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex-1">
                        <div class="flex items-center space-x-3 mb-2">
                            <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                ${student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <h4 class="text-xl font-semibold text-gray-900">${student.name}</h4>
                                <p class="text-gray-600">${student.email}</p>
                            </div>
                        </div>
                        <div class="ml-15 space-y-1">
                            <div class="flex items-center text-sm text-gray-500">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m0 0V7a2 2 0 012 2v6m0 0v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2m0 0V9a2 2 0 012-2h4a2 2 0 012 2v6z"></path>
                                </svg>
                                Joined: ${joinDate}
                            </div>
                            ${student.phone ? `
                                <div class="flex items-center text-sm text-gray-500">
                                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                                    </svg>
                                    ${student.phone}
                                </div>
                            ` : ''}
                            ${student.address ? `
                                <div class="flex items-center text-sm text-gray-500">
                                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    </svg>
                                    ${student.address}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="flex flex-col space-y-2">
                        <button onclick="editStudentProfile('${student.id}')" class="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                            Edit Profile
                        </button>
                        <button onclick="resetStudentPassword('${student.id}', '${student.name}', '${student.email}')" class="${student.forgot_password_request ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-orange-600 hover:bg-orange-700'} text-white px-3 py-1 rounded-lg transition-colors text-sm flex items-center justify-center relative">
                            ${student.forgot_password_request ? `
                                <div class="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 border border-white rounded-full animate-ping"></div>
                                <div class="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 border border-white rounded-full"></div>
                            ` : ''}
                            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2 2 2 0 00-2-2m-2-2H9l3 3m0 0l-3 3m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            ${student.forgot_password_request ? 'URGENT: Reset Password' : 'Reset Password'}
                        </button>
                        <button onclick="toggleStudentStatus('${student.id}', ${student.is_active !== false})" class="${student.is_active !== false ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'} text-white px-3 py-1 rounded-lg transition-colors text-sm">
                            ${student.is_active !== false ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onclick="deleteStudent('${student.id}')" class="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors text-sm">
                            Delete
                        </button>
                        <span class="${student.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} px-3 py-1 rounded-full text-xs font-medium text-center">
                            ${student.is_active !== false ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>
            </div>
        `
    }).join('')
    
    studentsManagementList.innerHTML = studentsHTML
}

=======
>>>>>>> 4acd36e60b0492681c3a96c0e76eab2890542f8b
// Modal functions
window.showAddExamModal = () => {
    document.getElementById('addExamModal').classList.remove('hidden')
}

window.hideAddExamModal = () => {
    document.getElementById('addExamModal').classList.add('hidden')
    document.getElementById('addExamForm').reset()
}

window.showAddQuestionModal = async () => {
    document.getElementById('addQuestionModal').classList.remove('hidden')
    await loadExamOptions()
}

window.hideAddQuestionModal = () => {
    document.getElementById('addQuestionModal').classList.add('hidden')
    document.getElementById('addQuestionForm').reset()
    hideQuestionOptions()
}

window.showEvaluationsModal = async () => {
    document.getElementById('evaluationsModal').classList.remove('hidden')
    await loadEvaluations()
}

window.hideEvaluationsModal = () => {
    document.getElementById('evaluationsModal').classList.add('hidden')
}

<<<<<<< HEAD
// Students Modal functions
window.showStudentsModal = async () => {
    document.getElementById('studentsModal').classList.remove('hidden')
    await loadStudentsList()
}

window.hideStudentsModal = () => {
    document.getElementById('studentsModal').classList.add('hidden')
}

// Edit Exam Modal functions
window.showEditExamModal = async (examId) => {
    document.getElementById('editExamModal').classList.remove('hidden')
    await loadExamForEdit(examId)
}

window.hideEditExamModal = () => {
    document.getElementById('editExamModal').classList.add('hidden')
    document.getElementById('editExamForm').reset()
}

// Edit Question Modal functions
window.showEditQuestionModal = async (questionId) => {
    document.getElementById('editQuestionModal').classList.remove('hidden')
    await loadQuestionForEdit(questionId)
}

window.hideEditQuestionModal = () => {
    document.getElementById('editQuestionModal').classList.add('hidden')
    document.getElementById('editQuestionForm').reset()
    hideEditQuestionOptions()
}

// Edit Student Profile Modal functions
window.showEditStudentModal = async (studentId) => {
    document.getElementById('editStudentModal').classList.remove('hidden')
    await loadStudentForEdit(studentId)
}

window.hideEditStudentModal = () => {
    document.getElementById('editStudentModal').classList.add('hidden')
    document.getElementById('editStudentForm').reset()
}

// Question Mode Switching
window.switchQuestionMode = (mode) => {
    const singleMode = document.getElementById('singleQuestionMode')
    const bulkMode = document.getElementById('bulkQuestionMode')
    const singleBtn = document.getElementById('singleModeBtn')
    const bulkBtn = document.getElementById('bulkModeBtn')
    
    if (mode === 'single') {
        singleMode.classList.remove('hidden')
        bulkMode.classList.add('hidden')
        singleBtn.classList.add('bg-blue-600', 'text-white')
        singleBtn.classList.remove('text-gray-700')
        bulkBtn.classList.remove('bg-blue-600', 'text-white')
        bulkBtn.classList.add('text-gray-700')
    } else {
        singleMode.classList.add('hidden')
        bulkMode.classList.remove('hidden')
        bulkBtn.classList.add('bg-blue-600', 'text-white')
        bulkBtn.classList.remove('text-gray-700')
        singleBtn.classList.remove('bg-blue-600', 'text-white')
        singleBtn.classList.add('text-gray-700')
        
        // Load exam options for bulk mode too
        loadBulkExamOptions()
    }
}

// Toggle edit question options based on type
window.toggleEditQuestionOptions = () => {
    const questionType = document.getElementById('editQuestionType').value
    hideEditQuestionOptions()
    
    if (questionType === 'multiple_choice') {
        document.getElementById('editMultipleChoiceOptions').classList.remove('hidden')
    } else if (questionType === 'true_false') {
        document.getElementById('editTrueFalseOptions').classList.remove('hidden')
    }
}

// Hide all edit question options
const hideEditQuestionOptions = () => {
    document.getElementById('editMultipleChoiceOptions').classList.add('hidden')
    document.getElementById('editTrueFalseOptions').classList.add('hidden')
}

=======
>>>>>>> 4acd36e60b0492681c3a96c0e76eab2890542f8b
// Toggle question options based on type
window.toggleQuestionOptions = () => {
    const questionType = document.getElementById('questionType').value
    hideQuestionOptions()
    
    if (questionType === 'multiple_choice') {
        document.getElementById('multipleChoiceOptions').classList.remove('hidden')
    } else if (questionType === 'true_false') {
        document.getElementById('trueFalseOptions').classList.remove('hidden')
    }
}

// Hide all question options
const hideQuestionOptions = () => {
    document.getElementById('multipleChoiceOptions').classList.add('hidden')
    document.getElementById('trueFalseOptions').classList.add('hidden')
}

// Load exam options for question form
const loadExamOptions = async () => {
    try {
        const { data: exams, error } = await database.getAllExams()
        if (error) throw error
        
        const examSelect = document.getElementById('questionExamId')
        examSelect.innerHTML = '<option value="">Choose an exam...</option>'
        
        exams.forEach(exam => {
            const option = document.createElement('option')
            option.value = exam.id
            option.textContent = exam.title
            examSelect.appendChild(option)
        })
        
    } catch (error) {
        console.error('Error loading exam options:', error)
    }
}

<<<<<<< HEAD
// Load exam options for bulk question form
const loadBulkExamOptions = async () => {
    try {
        const { data: exams, error } = await database.getAllExams()
        if (error) throw error
        
        const examSelect = document.getElementById('bulkQuestionExamId')
        examSelect.innerHTML = '<option value="">Choose an exam...</option>'
        
        exams.forEach(exam => {
            const option = document.createElement('option')
            option.value = exam.id
            option.textContent = exam.title
            examSelect.appendChild(option)
        })
        
    } catch (error) {
        console.error('Error loading exam options:', error)
    }
}

// Load students list
const loadStudentsList = async () => {
    try {
        const { data: students, error } = await database.getAllStudents()
        if (error) throw error
        
        displayStudentsList(students || [])
        
    } catch (error) {
        console.error('Error loading students:', error)
        utils.showNotification('Error loading students', 'error')
    }
}

// Display students list
const displayStudentsList = (students) => {
    const studentsList = document.getElementById('studentsList')
    
    if (!students || students.length === 0) {
        studentsList.innerHTML = `
            <div class="text-center py-8">
                <p class="text-gray-500">No students registered yet.</p>
            </div>
        `
        return
    }
    
    const studentsHTML = students.map((student, index) => {
        const joinDate = new Date(student.created_at).toLocaleDateString()
        
        return `
            <div class="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div class="flex justify-between items-center">
                    <div>
                        <h4 class="font-semibold text-gray-900">${student.name}</h4>
                        <p class="text-sm text-gray-600">${student.email}</p>
                        <p class="text-xs text-gray-500 mt-1">Joined: ${joinDate}</p>
                    </div>
                    <div class="text-right">
                        <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            Student #${index + 1}
                        </span>
                    </div>
                </div>
            </div>
        `
    }).join('')
    
    studentsList.innerHTML = studentsHTML
}

// Load exam for editing
const loadExamForEdit = async (examId) => {
    try {
        const { data: exam, error } = await database.getExamWithQuestions(examId)
        if (error) throw error
        
        // Populate form fields
        document.getElementById('editExamId').value = exam.id
        document.getElementById('editExamTitle').value = exam.title
        document.getElementById('editExamDescription').value = exam.description || ''
        document.getElementById('editExamDuration').value = exam.duration_minutes
        document.getElementById('editExamMarks').value = exam.total_marks
        
    } catch (error) {
        console.error('Error loading exam for edit:', error)
        utils.showNotification('Error loading exam details', 'error')
    }
}

// Load question for editing
const loadQuestionForEdit = async (questionId) => {
    try {
        const { data: question, error } = await database.getQuestion(questionId)
        if (error) throw error
        
        // Get exam details
        const { data: exam, error: examError } = await database.getExamDetails(question.exam_id)
        if (examError) throw examError
        
        // Populate form fields
        document.getElementById('editQuestionId').value = question.id
        document.getElementById('editQuestionExamTitle').value = exam.title
        document.getElementById('editQuestionText').value = question.question_text
        document.getElementById('editQuestionType').value = question.question_type
        document.getElementById('editQuestionMarks').value = question.marks
        
        // Handle question type specific fields
        if (question.question_type === 'multiple_choice') {
            if (question.options) {
                document.getElementById('editQuestionOptions').value = question.options.join('\n')
            }
            document.getElementById('editCorrectAnswer').value = question.correct_answer || ''
        } else if (question.question_type === 'true_false') {
            document.getElementById('editTrueFalseAnswer').value = question.correct_answer || 'true'
        }
        
        // Show appropriate options
        toggleEditQuestionOptions()
        
    } catch (error) {
        console.error('Error loading question for edit:', error)
        utils.showNotification('Error loading question details', 'error')
    }
}

// Load student for editing
const loadStudentForEdit = async (studentId) => {
    try {
        const { data: students, error } = await database.getAllStudents()
        if (error) throw error
        
        const student = students.find(s => s.id === studentId)
        if (!student) throw new Error('Student not found')
        
        // Populate form fields
        document.getElementById('editStudentId').value = student.id
        document.getElementById('editStudentName').value = student.name || ''
        document.getElementById('editStudentEmail').value = student.email || ''
        document.getElementById('editStudentPhone').value = student.phone || ''
        document.getElementById('editStudentAddress').value = student.address || ''
        
    } catch (error) {
        console.error('Error loading student for edit:', error)
        utils.showNotification('Error loading student details', 'error')
    }
}

=======
>>>>>>> 4acd36e60b0492681c3a96c0e76eab2890542f8b
// Load evaluations
const loadEvaluations = async () => {
    try {
        const { data: submissions, error } = await database.getAllSubmissions()
        if (error) throw error
        
        displayEvaluations(submissions || [])
        
    } catch (error) {
        console.error('Error loading evaluations:', error)
        utils.showNotification('Error loading evaluations', 'error')
    }
}

// Display evaluations
const displayEvaluations = (submissions) => {
    const evaluationsList = document.getElementById('evaluationsList')
    
    if (!submissions || submissions.length === 0) {
        evaluationsList.innerHTML = `
            <div class="text-center py-8">
                <p class="text-gray-500">No submissions to evaluate.</p>
            </div>
        `
        return
    }
    
    const evaluationsHTML = submissions.map(submission => {
        const date = new Date(submission.submitted_at).toLocaleDateString()
        const status = submission.is_evaluated ? 'Evaluated' : 'Pending'
        const statusColor = submission.is_evaluated ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        
        return `
            <div class="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h4 class="text-xl font-semibold text-gray-900">${submission.students.name}</h4>
                        <p class="text-sm text-gray-600">${submission.students.email}</p>
                        <p class="text-lg text-gray-700 mt-2">${submission.exams.title}</p>
                        <p class="text-sm text-gray-500">Submitted: ${date}</p>
                    </div>
                    <div class="flex items-center space-x-3">
                        <span class="px-3 py-1 rounded-full text-sm font-medium ${statusColor}">
                            ${status}
                        </span>
                        ${!submission.is_evaluated ? `
                            <button onclick="evaluateSubmission('${submission.id}')" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                                Evaluate Now
                            </button>
                        ` : `
                            <span class="text-sm text-gray-600">
                                Marks: ${submission.obtained_marks || 0}/${submission.exams.total_marks}
                            </span>
                        `}
                    </div>
                </div>
                
                ${!submission.is_evaluated ? `
                    <div class="mt-4 p-4 bg-white rounded-lg border">
                        <h5 class="font-semibold text-gray-900 mb-3">Student Answers:</h5>
                        <div class="space-y-2">
                            ${Object.entries(submission.answers || {}).map(([questionId, answer]) => `
                                <div class="text-sm">
                                    <span class="font-medium">Q${parseInt(questionId) + 1}:</span> 
                                    <span class="text-gray-700">${answer}</span>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="mt-4 flex items-center space-x-4">
                            <label class="flex items-center">
                                <span class="text-sm font-medium text-gray-700 mr-2">Marks Obtained:</span>
                                <input type="number" id="marks-${submission.id}" min="0" max="${submission.exams.total_marks}" class="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500">
                            </label>
                            <button onclick="publishResult('${submission.id}')" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                                Publish Result
                            </button>
                        </div>
                    </div>
                ` : ''}
            </div>
        `
    }).join('')
    
    evaluationsList.innerHTML = evaluationsHTML
}

// Evaluate submission
window.evaluateSubmission = (submissionId) => {
    // This function is handled in the displayEvaluations function
    console.log('Evaluating submission:', submissionId)
}

// Publish result
window.publishResult = async (submissionId) => {
    const marksInput = document.getElementById(`marks-${submissionId}`)
    const obtainedMarks = parseInt(marksInput.value)
    
    if (!marksInput.value || isNaN(obtainedMarks) || obtainedMarks < 0) {
        utils.showNotification('Please enter valid marks', 'error')
        return
    }
    
    showLoading()
    
    try {
        const { data, error } = await database.publishResult(submissionId, obtainedMarks)
        
        if (error) throw error
        
        utils.showNotification('Result published successfully!', 'success')
        
        // Reload evaluations
        await loadEvaluations()
        
    } catch (error) {
        console.error('Error publishing result:', error)
        utils.showNotification('Error publishing result', 'error')
    } finally {
        hideLoading()
    }
}

// Add exam form submission
document.getElementById('addExamForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    
    const title = document.getElementById('examTitle').value
    const description = document.getElementById('examDescription').value
    const duration = parseInt(document.getElementById('examDuration').value)
    const marks = parseInt(document.getElementById('examMarks').value)
    
    showLoading()
    
    try {
        const { data, error } = await database.addExam({
            title,
            description,
            duration_minutes: duration,
            total_marks: marks
        })
        
        if (error) throw error
        
        utils.showNotification('Exam created successfully!', 'success')
        hideAddExamModal()
        
        // Reload data
        await loadAdminPanel()
        
    } catch (error) {
        console.error('Error creating exam:', error)
        utils.showNotification('Error creating exam', 'error')
    } finally {
        hideLoading()
    }
})

// Add question form submission
document.getElementById('addQuestionForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    
    const examId = document.getElementById('questionExamId').value
    const questionText = document.getElementById('questionText').value
    const questionType = document.getElementById('questionType').value
    const marks = parseInt(document.getElementById('questionMarks').value)
    
    let options = null
    let correctAnswer = null
    
    if (questionType === 'multiple_choice') {
        const optionsText = document.getElementById('questionOptions').value
        options = optionsText.split('\n').filter(opt => opt.trim())
        correctAnswer = document.getElementById('correctAnswer').value
    } else if (questionType === 'true_false') {
        correctAnswer = document.getElementById('trueFalseAnswer').value
    }
    
    if (!examId || !questionText || !questionType || !marks) {
        utils.showNotification('Please fill all required fields', 'error')
        return
    }
    
    if (questionType === 'multiple_choice' && (!options || options.length < 2 || !correctAnswer)) {
        utils.showNotification('Please provide options and correct answer for multiple choice questions', 'error')
        return
    }
    
    if (questionType === 'true_false' && !correctAnswer) {
        utils.showNotification('Please select correct answer for true/false question', 'error')
        return
    }
    
    showLoading()
    
    try {
        const questionData = {
            exam_id: examId,
            question_text: questionText,
            question_type: questionType,
            marks,
            options: options,
            correct_answer: correctAnswer
        }
        
        const { data, error } = await database.addQuestion(questionData)
        
        if (error) throw error
        
        utils.showNotification('Question added successfully!', 'success')
        hideAddQuestionModal()
        
        // Reload data
        await loadAdminPanel()
        
    } catch (error) {
        console.error('Error adding question:', error)
        utils.showNotification('Error adding question', 'error')
    } finally {
        hideLoading()
    }
})

<<<<<<< HEAD
// Edit exam form submission
document.getElementById('editExamForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    
    const examId = document.getElementById('editExamId').value
    const title = document.getElementById('editExamTitle').value
    const description = document.getElementById('editExamDescription').value
    const duration = parseInt(document.getElementById('editExamDuration').value)
    const marks = parseInt(document.getElementById('editExamMarks').value)
    
    showLoading()
    
    try {
        const examData = {
            title,
            description,
            duration_minutes: duration,
            total_marks: marks
        }
        
        const { data, error } = await database.updateExam(examId, examData)
        
        if (error) throw error
        
        utils.showNotification('Exam updated successfully!', 'success')
        hideEditExamModal()
        
        // Reload data
        await loadAdminPanel()
        
    } catch (error) {
        console.error('Error updating exam:', error)
        utils.showNotification('Error updating exam', 'error')
    } finally {
        hideLoading()
    }
})

// Add bulk questions form submission
document.getElementById('addBulkQuestionsForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    
    const examId = document.getElementById('bulkQuestionExamId').value
    const bulkQuestions = document.getElementById('bulkQuestions').value.trim()
    
    if (!examId || !bulkQuestions) {
        utils.showNotification('Please fill all required fields', 'error')
        return
    }
    
    showLoading()
    
    try {
        const questionLines = bulkQuestions.split('\n').filter(line => line.trim())
        const questionsData = []
        
        for (let line of questionLines) {
            const parts = line.split('|')
            if (parts.length !== 5) {
                throw new Error(`Invalid format in line: ${line}`)
            }
            
            const [type, question, optionsOrAnswer, correctAnswer, marks] = parts
            let options = null
            
            if (type === 'multiple_choice') {
                options = optionsOrAnswer.split(',')
            }
            
            questionsData.push({
                exam_id: examId,
                question_text: question.trim(),
                question_type: type.trim(),
                options: options,
                correct_answer: correctAnswer.trim(),
                marks: parseInt(marks.trim())
            })
        }
        
        const { data, error } = await database.addMultipleQuestions(questionsData)
        
        if (error) throw error
        
        utils.showNotification(`${questionsData.length} questions added successfully!`, 'success')
        hideAddQuestionModal()
        
        // Reload data
        await loadAdminPanel()
        
    } catch (error) {
        console.error('Error adding bulk questions:', error)
        utils.showNotification('Error adding questions: ' + error.message, 'error')
    } finally {
        hideLoading()
    }
})

// Edit question form submission
document.getElementById('editQuestionForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    
    const questionId = document.getElementById('editQuestionId').value
    const questionText = document.getElementById('editQuestionText').value
    const questionType = document.getElementById('editQuestionType').value
    const marks = parseInt(document.getElementById('editQuestionMarks').value)
    
    let options = null
    let correctAnswer = null
    
    if (questionType === 'multiple_choice') {
        const optionsText = document.getElementById('editQuestionOptions').value
        options = optionsText.split('\n').filter(opt => opt.trim())
        correctAnswer = document.getElementById('editCorrectAnswer').value
    } else if (questionType === 'true_false') {
        correctAnswer = document.getElementById('editTrueFalseAnswer').value
    }
    
    if (!questionText || !questionType || !marks) {
        utils.showNotification('Please fill all required fields', 'error')
        return
    }
    
    if (questionType === 'multiple_choice' && (!options || options.length < 2 || !correctAnswer)) {
        utils.showNotification('Please provide options and correct answer for multiple choice questions', 'error')
        return
    }
    
    if (questionType === 'true_false' && !correctAnswer) {
        utils.showNotification('Please select correct answer for true/false question', 'error')
        return
    }
    
    showLoading()
    
    try {
        const questionData = {
            question_text: questionText,
            question_type: questionType,
            marks,
            options: options,
            correct_answer: correctAnswer
        }
        
        const { data, error } = await database.updateQuestion(questionId, questionData)
        
        if (error) throw error
        
        utils.showNotification('Question updated successfully!', 'success')
        hideEditQuestionModal()
        
        // Reload data
        await loadQuestions()
        
    } catch (error) {
        console.error('Error updating question:', error)
        utils.showNotification('Error updating question', 'error')
    } finally {
        hideLoading()
    }
})

// Edit student profile form submission
document.getElementById('editStudentForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    
    const studentId = document.getElementById('editStudentId').value
    const name = document.getElementById('editStudentName').value
    const email = document.getElementById('editStudentEmail').value
    const phone = document.getElementById('editStudentPhone').value
    const address = document.getElementById('editStudentAddress').value
    
    if (!name || !email) {
        utils.showNotification('Please fill all required fields', 'error')
        return
    }
    
    showLoading()
    
    try {
        const studentData = {
            name,
            email,
            phone: phone || null,
            address: address || null
        }
        
        const { data, error } = await database.updateStudentProfile(studentId, studentData)
        
        if (error) throw error
        
        utils.showNotification('Student profile updated successfully!', 'success')
        hideEditStudentModal()
        
        // Reload students management
        await loadStudentsManagement()
        
    } catch (error) {
        console.error('Error updating student profile:', error)
        utils.showNotification('Error updating student profile', 'error')
    } finally {
        hideLoading()
    }
})

=======
>>>>>>> 4acd36e60b0492681c3a96c0e76eab2890542f8b
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

<<<<<<< HEAD
// Edit exam function
window.editExam = (examId) => {
    showEditExamModal(examId)
}

// Toggle exam status function
window.toggleExamStatus = async (examId, currentStatus) => {
    const confirmMessage = currentStatus ? 
        'Are you sure you want to deactivate this exam?' : 
        'Are you sure you want to activate this exam?'
    
    if (!confirm(confirmMessage)) return
    
    showLoading()
    
    try {
        const { data, error } = await database.toggleExamStatus(examId, currentStatus)
        
        if (error) throw error
        
        const statusText = data.is_active ? 'activated' : 'deactivated'
        utils.showNotification(`Exam ${statusText} successfully!`, 'success')
        
        // Reload exams
        await loadExams()
        
    } catch (error) {
        console.error('Error toggling exam status:', error)
        utils.showNotification('Error updating exam status', 'error')
    } finally {
        hideLoading()
    }
}

// Delete exam function
window.deleteExam = async (examId) => {
    const confirmMessage = 'Are you sure you want to delete this exam? This action cannot be undone and will also delete all associated questions, submissions, and results.'
    
    if (!confirm(confirmMessage)) return
    
    showLoading()
    
    try {
        const { error } = await database.deleteExam(examId)
        
        if (error) throw error
        
        utils.showNotification('Exam deleted successfully!', 'success')
        
        // Reload exams and stats
        await loadAdminPanel()
        
    } catch (error) {
        console.error('Error deleting exam:', error)
        utils.showNotification('Error deleting exam', 'error')
    } finally {
        hideLoading()
    }
}

// Edit question function
window.editQuestion = (questionId) => {
    showEditQuestionModal(questionId)
}

// Delete question function
window.deleteQuestion = async (questionId) => {
    const confirmMessage = 'Are you sure you want to delete this question? This action cannot be undone.'
    
    if (!confirm(confirmMessage)) return
    
    showLoading()
    
    try {
        const { error } = await database.deleteQuestion(questionId)
        
        if (error) throw error
        
        utils.showNotification('Question deleted successfully!', 'success')
        
        // Reload questions
        await loadQuestions()
        
    } catch (error) {
        console.error('Error deleting question:', error)
        utils.showNotification('Error deleting question', 'error')
    } finally {
        hideLoading()
    }
}

// Edit student profile function
window.editStudentProfile = (studentId) => {
    showEditStudentModal(studentId)
}

// Delete student function
window.deleteStudent = async (studentId) => {
    const confirmMessage = 'Are you sure you want to DELETE this student? This action CANNOT be undone and will permanently remove:\n\n• Student profile and account\n• All their exam submissions\n• All their results and grades\n• Complete learning history\n\nType "DELETE" to confirm this permanent action.'
    
    const userConfirmation = prompt(confirmMessage)
    if (userConfirmation !== 'DELETE') {
        if (userConfirmation !== null) {
            utils.showNotification('Student deletion cancelled - confirmation text must be exactly "DELETE"', 'warning')
        }
        return
    }
    
    showLoading()
    
    try {
        const { error } = await database.deleteStudent(studentId)
        
        if (error) throw error
        
        utils.showNotification('Student deleted permanently', 'success')
        
        // Reload students management and stats
        await loadStudentsManagement()
        await loadStats()
        
    } catch (error) {
        console.error('Error deleting student:', error)
        utils.showNotification('Error deleting student: ' + error.message, 'error')
    } finally {
        hideLoading()
    }
}

// Toggle student status function
window.toggleStudentStatus = async (studentId, currentStatus) => {
    const action = currentStatus ? 'deactivate' : 'activate'
    const confirmMessage = currentStatus ? 
        'Are you sure you want to DEACTIVATE this student?\n\nDeactivated students will:\n• Lose access to all exams\n• Cannot submit new answers\n• Cannot view new results\n• Keep their existing data' :
        'Are you sure you want to ACTIVATE this student?\n\nActivated students will:\n• Regain access to exams\n• Can submit answers again\n• Can view results again'
    
    if (!confirm(confirmMessage)) return
    
    showLoading()
    
    try {
        const { data, error } = await database.toggleStudentStatus(studentId, currentStatus)
        
        if (error) throw error
        
        const statusText = data.is_active ? 'activated' : 'deactivated'
        utils.showNotification(`Student ${statusText} successfully`, 'success')
        
        // Reload students management
        await loadStudentsManagement()
        
    } catch (error) {
        console.error('Error toggling student status:', error)
        utils.showNotification('Error changing student status: ' + error.message, 'error')
    } finally {
        hideLoading()
    }
}

// Reset student password function
window.resetStudentPassword = (studentId, studentName, studentEmail) => {
    showResetPasswordModal(studentId, studentName, studentEmail)
}

// Show reset password modal
const showResetPasswordModal = (studentId, studentName, studentEmail) => {
    document.getElementById('resetPasswordStudentInfo').value = `${studentName} (${studentEmail})`
    document.getElementById('resetPasswordStudentEmail').value = studentEmail
    document.getElementById('tempPassword').value = ''
    document.getElementById('resetPasswordModal').classList.remove('hidden')
}

// Hide reset password modal
window.hideResetPasswordModal = () => {
    document.getElementById('resetPasswordModal').classList.add('hidden')
    document.getElementById('resetPasswordForm').reset()
}

// Generate temporary password
window.generateTempPassword = async () => {
    try {
        const { password } = await database.generateTempPassword()
        document.getElementById('tempPassword').value = password
    } catch (error) {
        console.error('Error generating password:', error)
        // Fallback to client-side generation
        const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
        let password = ''
        for (let i = 0; i < 8; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        document.getElementById('tempPassword').value = password
    }
}

// Reset password form submission
document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    
    const studentEmail = document.getElementById('resetPasswordStudentEmail').value
    const tempPassword = document.getElementById('tempPassword').value
    
    if (!tempPassword || tempPassword.length < 6) {
        utils.showNotification('Please enter a valid temporary password (minimum 6 characters)', 'error')
        return
    }
    
    const confirmMessage = `Are you sure you want to reset the password for this student?\n\nStudent: ${document.getElementById('resetPasswordStudentInfo').value}\n\nThe student will be forced to change this password on their next login.`
    
    if (!confirm(confirmMessage)) return
    
    showLoading()
    
    try {
        const result = await database.resetStudentPassword(studentEmail, tempPassword)
        
        if (!result.success) {
            throw new Error(result.error)
        }
        
        utils.showNotification('Student password reset successfully! They must change it on next login.', 'success')
        hideResetPasswordModal()
        
    } catch (error) {
        console.error('Error resetting password:', error)
        utils.showNotification('Error resetting password: ' + error.message, 'error')
    } finally {
        hideLoading()
    }
})

=======
>>>>>>> 4acd36e60b0492681c3a96c0e76eab2890542f8b








