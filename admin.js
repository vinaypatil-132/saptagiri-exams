import { auth, database, utils } from './supabase.js'

// Global variables
let currentUser = null
let adminProfile = null

// Initialize admin panel
document.addEventListener('DOMContentLoaded', async () => {
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
            loadExams()
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
                <div class="flex space-x-2">
                    <button onclick="editExam('${exam.id}')" class="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                        Edit
                    </button>
                    <button onclick="toggleExamStatus('${exam.id}', ${exam.is_active})" class="${exam.is_active ? 'bg-yellow-600' : 'bg-green-600'} text-white px-3 py-1 rounded-lg hover:${exam.is_active ? 'bg-yellow-700' : 'bg-green-700'} transition-colors text-sm">
                        ${exam.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                </div>
            </div>
        </div>
    `).join('')
    
    examsList.innerHTML = examsHTML
}

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









