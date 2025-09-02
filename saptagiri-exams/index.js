import { auth, utils } from './supabase.js'

// Modal functions
window.showLoginModal = () => {
    document.getElementById('loginModal').classList.remove('hidden')
}

window.hideLoginModal = () => {
    document.getElementById('loginModal').classList.add('hidden')
}

window.showRegisterModal = () => {
    document.getElementById('registerModal').classList.remove('hidden')
}

window.hideRegisterModal = () => {
    document.getElementById('registerModal').classList.add('hidden')
}

window.showAdminLogin = () => {
    hideLoginModal()
    document.getElementById('adminLoginModal').classList.remove('hidden')
}

window.hideAdminLoginModal = () => {
    document.getElementById('adminLoginModal').classList.add('hidden')
}

window.switchToRegister = () => {
    hideLoginModal()
    showRegisterModal()
}

window.switchToLogin = () => {
    hideRegisterModal()
    showLoginModal()
}

window.switchToStudentLogin = () => {
    hideAdminLoginModal()
    showLoginModal()
}

// Show/hide loading
const showLoading = () => {
    document.getElementById('loadingSpinner').classList.remove('hidden')
}

const hideLoading = () => {
    document.getElementById('loadingSpinner').classList.add('hidden')
}

// Add modals to the DOM
const addModals = () => {
    const modalHTML = `
        <!-- Login Modal -->
        <div id="loginModal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50">
            <div class="flex items-center justify-center min-h-screen p-4">
                <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-bounce-in">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-2xl font-bold text-gray-900">Student Login</h3>
                        <button onclick="hideLoginModal()" class="text-gray-400 hover:text-gray-600">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    
                    <form id="loginForm" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input type="email" id="loginEmail" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                            <input type="password" id="loginPassword" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <button type="submit" class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                            Login
                        </button>
                    </form>
                    
                    <div class="mt-4 text-center">
                        <p class="text-sm text-gray-600">Don't have an account? 
                            <button onclick="switchToRegister()" class="text-blue-600 hover:text-blue-800 font-medium">Register here</button>
                        </p>
                    </div>
                    
                    <div class="mt-4 text-center">
                        <button onclick="showAdminLogin()" class="text-sm text-gray-500 hover:text-gray-700">
                            Admin Login
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Register Modal -->
        <div id="registerModal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50">
            <div class="flex items-center justify-center min-h-screen p-4">
                <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-bounce-in">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-2xl font-bold text-gray-900">Student Registration</h3>
                        <button onclick="hideRegisterModal()" class="text-gray-400 hover:text-gray-600">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    
                    <form id="registerForm" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                            <input type="text" id="registerName" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input type="email" id="registerEmail" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                            <input type="password" id="registerPassword" required minlength="6" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                            <input type="password" id="registerConfirmPassword" required minlength="6" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <button type="submit" class="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-semibold">
                            Register
                        </button>
                    </form>
                    
                    <div class="mt-4 text-center">
                        <p class="text-sm text-gray-600">Already have an account? 
                            <button onclick="switchToLogin()" class="text-blue-600 hover:text-blue-800 font-medium">Login here</button>
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Admin Login Modal -->
        <div id="adminLoginModal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50">
            <div class="flex items-center justify-center min-h-screen p-4">
                <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-bounce-in">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-2xl font-bold text-gray-900">Admin Login</h3>
                        <button onclick="hideAdminLoginModal()" class="text-gray-400 hover:text-gray-600">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    
                    <form id="adminLoginForm" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input type="email" id="adminEmail" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                            <input type="password" id="adminPassword" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-transparent">
                        </div>
                        <button type="submit" class="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors font-semibold">
                            Admin Login
                        </button>
                    </form>
                    
                    <div class="mt-4 text-center">
                        <button onclick="switchToStudentLogin()" class="text-sm text-blue-600 hover:text-blue-800">
                            Student Login Instead
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `
    
    document.body.insertAdjacentHTML('beforeend', modalHTML)
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    addModals()
    setupEventListeners()
})

// Setup event listeners
const setupEventListeners = () => {
    // Student Login
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault()
        showLoading()
        
        const email = document.getElementById('loginEmail').value
        const password = document.getElementById('loginPassword').value
        
        try {
            const { data, error } = await auth.loginStudent(email, password)
            
            if (error) throw error
            
            utils.showNotification('Login successful! Redirecting...', 'success')
            setTimeout(() => {
                window.location.href = 'dashboard.html'
            }, 1500)
            
        } catch (error) {
            utils.showNotification(error.message, 'error')
        } finally {
            hideLoading()
        }
    })

    // Student Registration
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault()
        
        const name = document.getElementById('registerName').value
        const email = document.getElementById('registerEmail').value
        const password = document.getElementById('registerPassword').value
        const confirmPassword = document.getElementById('registerConfirmPassword').value
        
        if (password !== confirmPassword) {
            utils.showNotification('Passwords do not match!', 'error')
            return
        }
        
        showLoading()
        
        try {
            const { data, error } = await auth.registerStudent(email, password, name)
            
            if (error) throw error
            
            utils.showNotification('Registration successful! Please check your email for verification.', 'success')
            hideRegisterModal()
            
        } catch (error) {
            utils.showNotification(error.message, 'error')
        } finally {
            hideLoading()
        }
    })

    // Admin Login
    document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
        e.preventDefault()
        showLoading()
        
        const email = document.getElementById('adminEmail').value
        const password = document.getElementById('adminPassword').value
        
        try {
            const { data, error } = await auth.loginAdmin(email, password)
            
            if (error) throw error
            
            utils.showNotification('Admin login successful! Redirecting...', 'success')
            setTimeout(() => {
                window.location.href = 'admin.html'
            }, 1500)
            
        } catch (error) {
            utils.showNotification(error.message, 'error')
        } finally {
            hideLoading()
        }
    })

    // Check if user is already logged in
    checkAuthStatus()

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault()
            const target = document.querySelector(this.getAttribute('href'))
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                })
            }
        })
    })
}

// Check authentication status
const checkAuthStatus = async () => {
    try {
        const { user } = await auth.getCurrentUser()
        if (user) {
            const isAdmin = await auth.isAdmin()
            if (isAdmin) {
                window.location.href = 'admin.html'
            } else {
                window.location.href = 'dashboard.html'
            }
        }
    } catch (error) {
        console.log('User not authenticated')
    }
}
