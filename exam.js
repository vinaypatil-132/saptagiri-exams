import { auth, database, security, utils } from './supabase.js'

// Global variables
let currentUser = null
let userProfile = null
let examData = null
let questions = []
let currentQuestionIndex = 0
let answers = {}
let timeRemaining = 0
let timerInterval = null
let examStarted = false

// Initialize exam
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize enhanced security for exams
    auth.setupSecurityHandlers()
    security.enableAll()
    
    await checkAuth()
    if (currentUser) {
        await loadExam()
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
        document.getElementById('studentName').textContent = userProfile.name
        
    } catch (error) {
        console.error('Error loading profile:', error)
        utils.showNotification('Error loading profile', 'error')
    }
}

// Load exam data
const loadExam = async () => {
    const urlParams = new URLSearchParams(window.location.search)
    const examId = urlParams.get('id')
    
    if (!examId) {
        utils.showNotification('No exam ID provided', 'error')
        setTimeout(() => window.location.href = 'dashboard.html', 2000)
        return
    }
    
    showLoading()
    
    try {
        // Load exam details
        const { data: exam, error: examError } = await database.getExamDetails(examId)
        if (examError) throw examError
        
        examData = exam
        
        // Load questions
        const { data: examQuestions, error: questionsError } = await database.getExamQuestions(examId)
        if (questionsError) throw questionsError
        
        questions = examQuestions || []
        
        // Update UI
        updateExamInfo()
        createQuestionNavigation()
        
    } catch (error) {
        console.error('Error loading exam:', error)
        utils.showNotification('Error loading exam', 'error')
        setTimeout(() => window.location.href = 'dashboard.html', 2000)
    } finally {
        hideLoading()
    }
}

// Update exam information
const updateExamInfo = () => {
    if (examData) {
        document.getElementById('examTitle').textContent = examData.title
        document.getElementById('totalQuestions').textContent = questions.length
        timeRemaining = examData.duration_minutes * 60
    }
}

// Create question navigation grid
const createQuestionNavigation = () => {
    const questionGrid = document.getElementById('questionGrid')
    
    if (questions.length === 0) return
    
    const gridHTML = questions.map((_, index) => `
        <button 
            onclick="goToQuestion(${index})" 
            id="nav-${index}"
            class="w-10 h-10 rounded-lg border-2 border-gray-300 text-sm font-medium hover:border-blue-500 transition-colors ${
                index === 0 ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700'
            }"
        >
            ${index + 1}
        </button>
    `).join('')
    
    questionGrid.innerHTML = gridHTML
}

// Start exam
window.startExam = () => {
    if (questions.length === 0) {
        utils.showNotification('No questions available for this exam', 'error')
        return
    }
    
    examStarted = true
    document.getElementById('examInstructions').classList.add('hidden')
    document.getElementById('questionContainer').classList.remove('hidden')
    document.getElementById('questionNav').classList.remove('hidden')
    
    startTimer()
    displayQuestion(0)
}

// Display question
const displayQuestion = (index) => {
    if (index < 0 || index >= questions.length) return
    
    currentQuestionIndex = index
    const question = questions[index]
    
    // Update navigation
    document.getElementById('currentQuestion').textContent = index + 1
    
    // Update navigation buttons
    document.getElementById('prevBtn').disabled = index === 0
    document.getElementById('nextBtn').disabled = index === questions.length - 1
    
    // Show/hide submit section
    if (index === questions.length - 1) {
        document.getElementById('submitSection').classList.remove('hidden')
    } else {
        document.getElementById('submitSection').classList.add('hidden')
    }
    
    // Update question navigation
    updateQuestionNavigation(index)
    
    // Display question
    document.getElementById('questionText').textContent = question.question_text
    
    // Display options based on question type
    displayQuestionOptions(question)
    
    // Load saved answer
    loadSavedAnswer(index)
}

// Display question options
const displayQuestionOptions = (question) => {
    const optionsContainer = document.getElementById('questionOptions')
    
    if (question.question_type === 'multiple_choice' && question.options) {
        const optionsHTML = question.options.map((option, optionIndex) => `
            <label class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <input 
                    type="radio" 
                    name="question-${question.id}" 
                    value="${option}" 
                    class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    onchange="saveAnswerToMemory(${currentQuestionIndex}, '${option}')"
                >
                <span class="ml-3 text-gray-900">${option}</span>
            </label>
        `).join('')
        
        optionsContainer.innerHTML = optionsHTML
    } else if (question.question_type === 'true_false') {
        const optionsHTML = `
            <label class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <input 
                    type="radio" 
                    name="question-${question.id}" 
                    value="true" 
                    class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    onchange="saveAnswerToMemory(${currentQuestionIndex}, 'true')"
                >
                <span class="ml-3 text-gray-900">True</span>
            </label>
            <label class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <input 
                    type="radio" 
                    name="question-${question.id}" 
                    value="false" 
                    class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    onchange="saveAnswerToMemory(${currentQuestionIndex}, 'false')"
                >
                <span class="ml-3 text-gray-900">False</span>
            </label>
        `
        optionsContainer.innerHTML = optionsHTML
    } else if (question.question_type === 'essay') {
        const optionsHTML = `
            <textarea 
                id="essay-${question.id}"
                rows="6" 
                class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Type your answer here..."
                onblur="saveAnswerToMemory(${currentQuestionIndex, this.value})"
            ></textarea>
        `
        optionsContainer.innerHTML = optionsHTML
    }
}

// Update question navigation
const updateQuestionNavigation = (currentIndex) => {
    questions.forEach((_, index) => {
        const navButton = document.getElementById(`nav-${index}`)
        if (navButton) {
            if (index === currentIndex) {
                navButton.className = 'w-10 h-10 rounded-lg border-2 border-blue-500 bg-blue-500 text-white text-sm font-medium'
            } else if (answers[index]) {
                navButton.className = 'w-10 h-10 rounded-lg border-2 border-green-500 bg-green-100 text-green-700 text-sm font-medium'
            } else {
                navButton.className = 'w-10 h-10 rounded-lg border-2 border-gray-300 bg-white text-gray-700 text-sm font-medium hover:border-blue-500 transition-colors'
            }
        }
    })
}

// Load saved answer
const loadSavedAnswer = (questionIndex) => {
    const savedAnswer = answers[questionIndex]
    if (!savedAnswer) return
    
    const question = questions[questionIndex]
    
    if (question.question_type === 'essay') {
        const textarea = document.getElementById(`essay-${question.id}`)
        if (textarea) textarea.value = savedAnswer
    } else {
        const radioButton = document.querySelector(`input[name="question-${question.id}"][value="${savedAnswer}"]`)
        if (radioButton) radioButton.checked = true
    }
}

// Save answer to memory
window.saveAnswerToMemory = (questionIndex, answer) => {
    answers[questionIndex] = answer
    updateQuestionNavigation(currentQuestionIndex)
}

// Save answer
window.saveAnswer = () => {
    const currentAnswer = answers[currentQuestionIndex]
    if (!currentAnswer) {
        utils.showNotification('Please select an answer before saving', 'warning')
        return
    }
    
    utils.showNotification('Answer saved successfully!', 'success')
}

// Next question
window.nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
        displayQuestion(currentQuestionIndex + 1)
    }
}

// Previous question
window.previousQuestion = () => {
    if (currentQuestionIndex > 0) {
        displayQuestion(currentQuestionIndex - 1)
    }
}

// Go to specific question
window.goToQuestion = (index) => {
    if (index >= 0 && index < questions.length) {
        displayQuestion(index)
    }
}

// Start timer
const startTimer = () => {
    timerInterval = setInterval(() => {
        timeRemaining--
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval)
            showTimeUpModal()
            return
        }
        
        // Update timer display
        const minutes = Math.floor(timeRemaining / 60)
        const seconds = timeRemaining % 60
        document.getElementById('timer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        
        // Warning when time is running low
        if (timeRemaining <= 300) { // 5 minutes
            document.getElementById('timer').classList.add('animate-pulse-warning')
        }
    }, 1000)
}

// Show time up modal
const showTimeUpModal = () => {
    document.getElementById('timeUpModal').classList.remove('hidden')
}

// Auto submit when time is up
window.autoSubmit = () => {
    submitExamAnswers()
}

// Submit exam
window.submitExam = () => {
    if (confirm('Are you sure you want to submit your exam? You cannot change your answers after submission.')) {
        submitExamAnswers()
    }
}

// Submit exam answers
const submitExamAnswers = async () => {
    showLoading()
    
    try {
        const urlParams = new URLSearchParams(window.location.search)
        const examId = urlParams.get('id')
        
        const { data, error } = await database.submitExam(examId, answers)
        
        if (error) throw error
        
        utils.showNotification('Exam submitted successfully!', 'success')
        
        setTimeout(() => {
            window.location.href = 'dashboard.html'
        }, 2000)
        
    } catch (error) {
        console.error('Error submitting exam:', error)
        utils.showNotification('Error submitting exam', 'error')
    } finally {
        hideLoading()
    }
}

// Enable security measures
const enableSecurity = () => {
    security.enableAll()
    
    // Additional exam-specific security
    document.addEventListener('keydown', (e) => {
        // Prevent F5 refresh
        if (e.key === 'F5') {
            e.preventDefault()
            showWarning('Refreshing the page is not allowed during the exam!')
        }
        
        // Prevent Ctrl+R
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault()
            showWarning('Refreshing the page is not allowed during the exam!')
        }
        
        // Prevent Ctrl+Shift+R
        if (e.ctrlKey && e.shiftKey && e.key === 'R') {
            e.preventDefault()
            showWarning('Refreshing the page is not allowed during the exam!')
        }
    })
    
    // Prevent page unload
    window.addEventListener('beforeunload', (e) => {
        if (examStarted) {
            e.preventDefault()
            e.returnValue = 'Are you sure you want to leave? Your exam progress will be lost.'
            return e.returnValue
        }
    })
    
    // Prevent back button
    window.addEventListener('popstate', (e) => {
        if (examStarted) {
            e.preventDefault()
            showWarning('Going back is not allowed during the exam!')
            history.pushState(null, null, window.location.href)
        }
    })
    
    // Prevent context menu
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault()
        showWarning('Right-click is disabled during the exam!')
    })
    
    // Prevent text selection
    document.addEventListener('selectstart', (e) => {
        e.preventDefault()
    })
    
    // Prevent drag and drop
    document.addEventListener('dragstart', (e) => {
        e.preventDefault()
    })
}

// Show warning
const showWarning = (message) => {
    document.getElementById('warningMessage').textContent = message
    document.getElementById('warningModal').classList.remove('hidden')
}

// Hide warning modal
window.hideWarningModal = () => {
    document.getElementById('warningModal').classList.add('hidden')
}

// Show/hide loading
const showLoading = () => {
    document.getElementById('loadingSpinner').classList.remove('hidden')
}

const hideLoading = () => {
    document.getElementById('loadingSpinner').classList.add('hidden')
}


