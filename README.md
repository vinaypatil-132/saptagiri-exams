# 🎓 Saptagiri Rural Computers - Online Exam Portal

A secure, responsive, and feature-rich online examination system designed specifically for rural computer education centers. Built with HTML, Tailwind CSS, JavaScript, and Supabase backend.

## ✨ Features

### 🔐 Security & Anti-Cheat
- **Right-click disabled** during exams
- **Copy/paste prevention** for all content
- **Text selection disabled** to prevent copying
- **Keyboard shortcuts blocked** (F12, Ctrl+Shift+I, etc.)
- **Screen switching detection** with warnings
- **Page refresh prevention** during exams
- **Back button disabled** during exam sessions

### 👨‍🎓 Student Features
- **User Registration & Login** with email verification
- **Exam Dashboard** showing available tests
- **Real-time Timer** with countdown warnings
- **Question Navigation** with progress tracking
- **Auto-save** answers as you progress
- **Results Dashboard** with grades and performance analytics
- **Mobile Responsive** design for all devices

### 👨‍💼 Admin Features
- **Admin Authentication** with role-based access
- **Exam Management** - Create, edit, activate/deactivate
- **Question Management** - Multiple choice, True/False, Essay
- **Submission Evaluation** - Review student answers
- **Result Publication** - Automatic grade calculation
- **Analytics Dashboard** - Overview of all activities

### 🎨 UI/UX Features
- **Professional Design** with computer institute theme
- **Smooth Animations** and transitions
- **Responsive Layout** for all screen sizes
- **Modern Interface** with intuitive navigation
- **Loading States** and user feedback
- **Notification System** for user actions

## 🚀 Quick Start

### 1. Supabase Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your Project URL and Anon Key

2. **Run Database Schema**
   - Open Supabase SQL Editor
   - Copy and paste the SQL from `SUPABASE_SETUP.md`
   - Execute all the SQL commands

3. **Update Configuration**
   - Open `supabase.js`
   - Replace the URL and key with your project details

### 2. Local Development

1. **Clone/Download** the project files
2. **Open** `index.html` in a web browser
3. **Register** as a student or admin
4. **Start** using the system!

### 3. Production Deployment

1. **Upload** all files to your web server
2. **Ensure** HTTPS is enabled (required for Supabase)
3. **Test** all functionality
4. **Share** the URL with students

## 📁 File Structure

```
saptagiri-exams/
├── index.html              # Landing page with login/register
├── dashboard.html          # Student dashboard
├── exam.html              # Secure exam interface
├── admin.html             # Admin panel
├── supabase.js            # Supabase client & functions
├── index.js               # Landing page functionality
├── dashboard.js           # Student dashboard logic
├── exam.js                # Exam interface logic
├── admin.js               # Admin panel logic
├── SUPABASE_SETUP.md      # Database setup guide
└── README.md              # This file
```

## 🗄️ Database Schema

### Tables
- **students** - Student profiles and authentication
- **exams** - Exam details and configuration
- **questions** - Individual exam questions
- **submissions** - Student exam submissions
- **results** - Published exam results
- **admin_users** - Admin user management

### Row Level Security (RLS)
- Students can only access their own data
- Admins have full access to all data
- Secure data isolation between users

## 🔧 Configuration

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Settings
- Enable Row Level Security (RLS)
- Configure authentication providers
- Set up email templates
- Configure storage policies

## 📱 Browser Support

- **Chrome** 80+
- **Firefox** 75+
- **Safari** 13+
- **Edge** 80+
- **Mobile browsers** (iOS Safari, Chrome Mobile)

## 🛡️ Security Features

### Anti-Cheat Measures
- **Client-side restrictions** on right-click, copy/paste
- **Server-side validation** of all submissions
- **Session management** with automatic logout
- **Data encryption** in transit and at rest

### Authentication
- **Supabase Auth** with secure token management
- **Role-based access control** (Student/Admin)
- **Session timeout** and automatic logout
- **Password requirements** and validation

## 🎯 Usage Guide

### For Students
1. **Register** with your name, email, and password
2. **Login** to access your dashboard
3. **View** available exams
4. **Start** an exam when ready
5. **Answer** questions within the time limit
6. **Submit** your exam automatically or manually
7. **View** results once published by admin

### For Administrators
1. **Login** with admin credentials
2. **Create** new exams with questions
3. **Monitor** student submissions
4. **Evaluate** and grade submissions
5. **Publish** results for students
6. **Manage** exam settings and content

## 🔍 Troubleshooting

### Common Issues

**"Supabase connection failed"**
- Check your project URL and API key
- Ensure your project is active
- Verify network connectivity

**"Authentication error"**
- Clear browser cookies and cache
- Check if user exists in Supabase
- Verify email verification status

**"Exam not loading"**
- Check if exam is active
- Verify questions exist for the exam
- Check browser console for errors

### Debug Mode
Enable browser developer tools to see detailed error messages and network requests.

## 📊 Performance

- **Fast Loading** with optimized assets
- **Responsive Design** for all devices
- **Efficient Database** queries with RLS
- **Minimal Dependencies** for faster execution

## 🔮 Future Enhancements

- **Offline Support** with service workers
- **Advanced Analytics** and reporting
- **Bulk Import** of questions
- **API Integration** with other systems
- **Multi-language** support
- **Advanced Question Types** (matching, ordering)

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- **Email**: info@saptagiri.com
- **Phone**: +91 98765 43210
- **Address**: Rural Computer Center, Main Street

## 🙏 Acknowledgments

- **Supabase** for the excellent backend service
- **Tailwind CSS** for the beautiful UI framework
- **Rural Education** communities for inspiration
- **Open Source** community for tools and libraries

---

**Built with ❤️ for rural computer education**

*Empowering rural communities through technology and education*
