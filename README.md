# CampusIQ - Smart Campus Management System

## 🎓 Overview
CampusIQ is a fully functional, production-ready school/college management system with real-time database synchronization and **comprehensive Excel import/export functionality**.

## ✅ Features Implemented

### 🔐 Authentication System
- Role-based login (Admin, Faculty, Student)
- JWT token-based authentication with secure cookies
- Password management with forced change on first login
- Session handling across all panels

### 📊 Admin Panel
- **Dashboard with real-time stats**
  - Total students, faculty, events, users
- **Excel-Based User Management** ⭐
  - **Import Students via CSV/Excel** with bulk upload
  - **Import Faculty via CSV/Excel** with bulk upload
  - **Export Students to Excel** with all details
  - **Export Faculty to Excel** with all details
  - **Download Excel Templates** for easy data entry
  - Real-time import preview and validation
  - Default password assignment (student@123, faculty@123)
  - Duplicate detection and skip functionality
- **Subject Management**
  - Create, update, delete subjects
  - Assign faculty to subjects
  - Department and semester organization
- **Events Management**
  - Create and manage campus events
  - Department-wise or institution-wide events
- **Announcements System**
  - Post announcements to specific roles or all users
  - Urgency levels (normal, high)
  - Real-time display across panels
- **Faculty Seating Management**
  - Room allocation and floor mapping
  - Availability status tracking

### 🎓 Student Panel
- **Personal Dashboard**
  - CGPA display with semester breakdown
  - Average attendance across all subjects
  - Upcoming events
  - Credits earned tracking
- **Attendance Tracking**
  - Subject-wise attendance records
  - Present/Absent/Leave counts
  - Percentage calculation with alerts
  - Below 75% threshold warnings
- **Academic Performance**
  - Semester-wise marks and grades
  - Grade points (GP) calculation
  - CGPA with detailed breakdown
  - Subject credits tracking
- **Events Feed**
  - Department-specific and general events
  - Date, time, venue information

### 👨‍🏫 Faculty Panel
- **Attendance Management** ⭐
  - Select subject and load enrolled students
  - Mark attendance (Present/Absent/Leave)
  - View student-wise overall attendance percentage
  - **Export attendance records to Excel**
  - Session-based tracking (09:00-10:00, etc.)
  - Real-time database updates
- **Marks Entry** ⭐
  - Subject-wise marks entry
  - Automatic grade calculation (O, A+, A, B+, B, C, F)
  - Grade point assignment (10, 9, 8, 7, 6, 5, 0)
  - **Export marks to Excel**
  - Semester-wise organization
- **Class Management**
  - View assigned subjects
  - Student lists with roll numbers
  - Real-time updates

### 📑 Excel Import/Export System ⭐⭐⭐

#### Import Features:
1. **Student Bulk Import**
   - Upload CSV/Excel with student data
   - Required fields: Name, Email, Department, Batch, Semester
   - Automatic validation and duplicate detection
   - Preview before import
   - Default password assignment
   - Import summary (added/skipped counts)

2. **Faculty Bulk Import**
   - Upload CSV/Excel with faculty data
   - Required fields: Name, Email, Employee Code, Department, Room, Floor, Mobile
   - Automatic faculty seat creation
   - Room and floor mapping
   - Default password assignment

#### Export Features:
1. **Student Export to Excel**
   - All student records with complete details
   - Department, batch, semester information
   - Status (Active/Inactive)
   - Timestamped filename

2. **Faculty Export to Excel**
   - All faculty records with complete details
   - Employee code, room, mobile
   - Department assignment
   - Timestamped filename

3. **Attendance Export to Excel**
   - Date-wise attendance records
   - Student names and subjects
   - Session information
   - Status (P/A/L)
   - Comprehensive reports

4. **Marks Export to Excel**
   - Student-wise marks records
   - Subject, semester, marks, grade, GP
   - Roll numbers and student names
   - Complete academic records

5. **Template Downloads**
   - Pre-formatted Excel templates
   - Sample data for reference
   - Easy data entry format

### 🗃️ Database System
- **MongoDB** for scalable data storage
- Real-time synchronization across all panels
- Collections:
  - users (admin, faculty, students)
  - subjects
  - attendance
  - grades
  - events
  - announcements
  - faculty_seats
  - timetable
- Automatic indexing on email and subject codes
- UUID-based unique identifiers

### 🎨 User Interface
- **Preserved original CampusIQ design**
- Navy blue and gold color scheme
- Responsive layout (mobile-friendly)
- Clean, modern dashboard cards
- Real-time data updates
- Professional typography
- Sidebar navigation
- Stats overview cards

## 🔑 Test Credentials

### Admin
- Email: `admin@cuchd.in`
- Password: `admin@123`
- Access: Full system control, Excel import/export

### Student
- Email: `student@cuchd.in`
- Password: `student@123`
- Access: View attendance, marks, CGPA

### Faculty
- Email: `faculty@cumail.in`
- Password: `faculty@123`
- Access: Mark attendance, enter marks, Excel export

## 🛠️ Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **MongoDB** - NoSQL database
- **Motor** - Async MongoDB driver
- **Pandas** - Excel/CSV processing
- **OpenPyXL** - Excel file generation
- **PassLib** - Password hashing (bcrypt)
- **Python-JOSE** - JWT token management
- **Pydantic** - Data validation

### Frontend
- **React** - UI framework
- **React Router** - Navigation
- **Axios** - API communication
- **XLSX** - Excel file handling
- **React-CSV** - CSV export
- **Custom CSS** - Original design preserved

## 📁 Project Structure

```
/app/
├── backend/
│   ├── server.py           # Main FastAPI application with all routes
│   ├── models.py           # Pydantic models and schemas
│   ├── database.py         # MongoDB connection
│   ├── auth.py             # Authentication utilities
│   ├── excel_utils.py      # Excel import/export functions
│   ├── requirements.txt    # Python dependencies
│   └── .env                # Environment variables
├── frontend/
│   ├── src/
│   │   ├── App.js          # Main React app with all pages
│   │   ├── App.css         # Original CampusIQ design
│   │   └── services/
│   │       └── api.js      # API service layer
│   ├── package.json        # Node dependencies
│   └── .env                # Frontend config
└── memory/
    └── test_credentials.md # Test accounts and features list
```

## 🚀 Key Features Highlights

### ✅ Excel System (Primary Focus)
1. **One-click Excel import** for students and faculty
2. **Instant Excel export** for all data
3. **Template downloads** for easy data entry
4. **Attendance records** export to Excel
5. **Marks/grades** export to Excel
6. **Import validation** with error reporting
7. **Duplicate detection** during import
8. **Bulk operations** for hundreds of records

### ✅ Real-Time Data Sync
- All panels (Admin, Student, Faculty) share same database
- No mock or demo data in production
- Instant updates across all users
- Consistent data everywhere

### ✅ Production-Ready Features
- Secure authentication with JWT
- Password hashing with bcrypt
- Role-based access control
- Input validation and error handling
- Responsive design for mobile
- Clean, professional UI
- Database indexes for performance

### ✅ Academic Management
- CGPA calculation with grade points
- Attendance tracking with percentages
- Marks entry with automatic grading
- Subject and faculty management
- Event and announcement system
- Timetable organization

## 📊 Excel Import/Export Workflows

### Student Import Workflow:
1. Admin clicks "Download Template"
2. Fills Excel with student data (Name, Email, Dept, Batch, Sem)
3. Clicks "Import Excel" and uploads file
4. System validates and shows preview
5. System imports students with default password
6. Shows summary: "Added 150, Skipped 5"
7. Students can immediately login

### Attendance Export Workflow:
1. Faculty marks attendance for a subject
2. Clicks "Export to Excel"
3. System generates Excel file with:
   - Date, Student Name, Subject, Session, Status
4. Downloads automatically
5. Faculty can maintain offline records

### Marks Export Workflow:
1. Faculty enters marks for all students
2. Clicks "Export to Excel"
3. System generates complete marksheet:
   - Student Name, Roll No, Subject, Marks, Grade, GP
4. Downloads for record-keeping

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Admin
- `GET /api/admin/stats` - Dashboard stats
- `GET /api/admin/users` - List users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/{id}` - Update user
- `DELETE /api/admin/users/{id}` - Delete user
- `POST /api/admin/users/import` - **Import Excel**
- `GET /api/admin/users/export` - **Export Excel**
- `GET /api/admin/templates/{type}` - **Download template**

### Subjects
- `GET /api/subjects` - List subjects
- `POST /api/subjects` - Create subject
- `PUT /api/subjects/{id}` - Update subject
- `DELETE /api/subjects/{id}` - Delete subject

### Attendance
- `POST /api/attendance/mark` - Mark attendance
- `GET /api/attendance/subject/{id}` - Get subject attendance
- `GET /api/attendance/student/{id}` - Get student attendance
- `GET /api/attendance/export` - **Export attendance to Excel**

### Marks
- `POST /api/marks/enter` - Enter marks
- `GET /api/marks/subject/{id}` - Get subject marks
- `GET /api/marks/student/{id}` - Get student marks
- `GET /api/marks/export` - **Export marks to Excel**

### Events & Announcements
- `GET /api/events` - List events
- `POST /api/events` - Create event
- `DELETE /api/events/{id}` - Delete event
- `GET /api/announcements` - List announcements
- `POST /api/announcements` - Create announcement

### Faculty
- `GET /api/faculty-seats` - List faculty seats
- `PUT /api/faculty-seats/my` - Update own seat

### Student
- `GET /api/student/dashboard` - Student dashboard data

## 🎯 System Status
✅ Backend: Running on port 8001
✅ Frontend: Running on port 3000
✅ MongoDB: Running on port 27017
✅ Database: Seeded with test data
✅ All APIs: Tested and working
✅ Excel Import/Export: Fully functional
✅ Authentication: Working with JWT
✅ Real-time sync: Active

## 📈 Usage Instructions

### For Admins:
1. Login with admin credentials
2. View dashboard stats
3. Click "Download Template" to get Excel template
4. Fill template with student/faculty data
5. Click "Import Excel" and upload file
6. Review import summary
7. Click "Export Excel" to download current data

### For Faculty:
1. Login with faculty credentials
2. Go to "Mark Attendance"
3. Select subject from dropdown
4. Mark attendance for all students (P/A/L)
5. Click "Submit Attendance"
6. Click "Export to Excel" to download records
7. Similar workflow for marks entry

### For Students:
1. Login with student credentials
2. View CGPA and attendance on dashboard
3. Check low attendance warnings
4. View detailed attendance per subject
5. Check marks and grades
6. View upcoming events

## 🔐 Security Features
- Passwords hashed with bcrypt
- JWT tokens with expiration
- HTTP-only cookies for sessions
- Role-based access control
- Input validation on all endpoints
- MongoDB injection prevention
- CORS configured properly

## 📝 Notes
- First-time users must change password
- Default passwords: student@123, faculty@123
- Excel files support .csv, .xlsx, .xls formats
- Attendance marked session-wise (configurable)
- CGPA calculated automatically
- All times in UTC (adjust as needed)

## 🎉 Summary
This is a **complete, production-ready** school management system with:
- ✅ Full Excel import/export for all data
- ✅ Real-time database synchronization
- ✅ No mock data - all features functional
- ✅ Professional UI (original design preserved)
- ✅ Secure authentication
- ✅ Role-based dashboards
- ✅ Comprehensive academic management
- ✅ Attendance and marks tracking
- ✅ Events and announcements
- ✅ Mobile-responsive design

**Focus: Excel record system is fully implemented and working across all modules.**
