from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Response, Cookie
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta, date
from typing import List, Optional
import os
import logging
from pathlib import Path
from dotenv import load_dotenv
import uuid

# Local imports
from database import Database, get_database
from models import *
from auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, require_role
)
from excel_utils import (
    parse_csv_data, create_student_template, create_faculty_template,
    export_students_excel, export_faculty_excel, export_attendance_excel,
    export_marks_excel, export_cgpa_report_excel
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app
app = FastAPI(title="CampusIQ API")

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def calculate_grade(marks: float) -> tuple:
    """Calculate grade and grade point from marks"""
    if marks >= 90:
        return "O", 10.0
    elif marks >= 80:
        return "A+", 9.0
    elif marks >= 70:
        return "A", 8.0
    elif marks >= 60:
        return "B+", 7.0
    elif marks >= 50:
        return "B", 6.0
    elif marks >= 40:
        return "C", 5.0
    else:
        return "F", 0.0

async def get_user_by_email(db, email: str):
    """Get user by email"""
    return await db.users.find_one({"email": email})

async def get_user_by_id(db, user_id: str):
    """Get user by ID"""
    return await db.users.find_one({"id": user_id})

# ============================================================================
# AUTHENTICATION ROUTES
# ============================================================================

@api_router.post("/auth/login")
async def login(credentials: UserLogin, response: Response):
    """Login endpoint"""
    db = get_database()
    
    # Find user
    user = await get_user_by_email(db, credentials.email.lower())
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(credentials.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Check role
    if user['role'] != credentials.role:
        raise HTTPException(
            status_code=403,
            detail=f'This account is a "{user["role"]}" account. Please select the correct role.'
        )
    
    # Check if active
    if not user.get('is_active', True):
        raise HTTPException(status_code=403, detail="Your account has been deactivated")
    
    # Create access token
    access_token = create_access_token(
        data={
            "user_id": user['id'],
            "email": user['email'],
            "role": user['role'],
            "name": user['name']
        }
    )
    
    # Set cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=60 * 60 * 24 * 7 if credentials.remember else 60 * 60 * 24,
        samesite="lax"
    )
    
    # Redirect map
    redirect_map = {
        "student": "/student",
        "faculty": "/faculty",
        "admin": "/admin"
    }
    
    return {
        "success": True,
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user['id'],
            "name": user['name'],
            "email": user['email'],
            "role": user['role'],
            "must_change_password": user.get('must_change_password', False)
        },
        "redirect": redirect_map.get(user['role'], '/')
    }

@api_router.post("/auth/logout")
async def logout(response: Response):
    """Logout endpoint"""
    response.delete_cookie("access_token")
    return {"success": True, "message": "Logged out successfully"}

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user info"""
    db = get_database()
    user = await get_user_by_id(db, current_user['user_id'])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Remove password hash
    user.pop('password_hash', None)
    user.pop('_id', None)
    
    return user

@api_router.post("/auth/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: dict = Depends(get_current_user)
):
    """Change password"""
    db = get_database()
    user = await get_user_by_id(db, current_user['user_id'])
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # If not first-time change, verify old password
    if not user.get('must_change_password', False):
        if not password_data.old_password:
            raise HTTPException(status_code=400, detail="Old password required")
        if not verify_password(password_data.old_password, user['password_hash']):
            raise HTTPException(status_code=401, detail="Current password is incorrect")
    
    # Validate new password
    if len(password_data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Update password
    await db.users.update_one(
        {"id": current_user['user_id']},
        {
            "$set": {
                "password_hash": get_password_hash(password_data.new_password),
                "must_change_password": False
            }
        }
    )
    
    return {"success": True, "message": "Password changed successfully"}

# ============================================================================
# ADMIN ROUTES - User Management
# ============================================================================

@api_router.get("/admin/stats")
async def admin_stats(current_user: dict = Depends(get_current_user)):
    """Get admin dashboard stats"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Access denied")
    
    db = get_database()
    
    total_students = await db.users.count_documents({"role": "student", "is_active": True})
    total_faculty = await db.users.count_documents({"role": "faculty", "is_active": True})
    active_events = await db.events.count_documents({"is_active": True})
    total_users = await db.users.count_documents({"is_active": True})
    
    return {
        "total_students": total_students,
        "total_faculty": total_faculty,
        "active_events": active_events,
        "total_users": total_users
    }

@api_router.get("/admin/users")
async def list_users(
    role: Optional[str] = None,
    dept: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List all users"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Access denied")
    
    db = get_database()
    query = {}
    if role:
        query['role'] = role
    if dept:
        query['dept'] = dept
    
    users = await db.users.find(query, {"password_hash": 0, "_id": 0}).to_list(1000)
    return {"users": users}

@api_router.post("/admin/users")
async def create_user(
    user_data: UserCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create new user"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Access denied")
    
    db = get_database()
    
    # Check if email exists
    existing = await get_user_by_email(db, user_data.email.lower())
    if existing:
        raise HTTPException(status_code=409, detail=f"Email {user_data.email} already exists")
    
    # Create user
    user_dict = user_data.dict()
    user_dict['id'] = str(uuid.uuid4())
    user_dict['email'] = user_dict['email'].lower()
    user_dict['password_hash'] = get_password_hash(user_dict.pop('password'))
    user_dict['is_active'] = True
    user_dict['must_change_password'] = True
    user_dict['created_at'] = datetime.utcnow()
    
    await db.users.insert_one(user_dict)
    
    # If faculty, create seat
    if user_data.role == UserRole.FACULTY and user_data.room_no:
        floor = int(user_data.room_no[0]) if user_data.room_no and user_data.room_no[0].isdigit() else 0
        seat = {
            "id": str(uuid.uuid4()),
            "faculty_id": user_dict['id'],
            "building": "Academic Block",
            "floor": floor,
            "room_no": user_data.room_no,
            "availability": "available",
            "office_hours": "9AM-5PM",
            "phone": user_data.mobile
        }
        await db.faculty_seats.insert_one(seat)
    
    user_dict.pop('password_hash')
    user_dict.pop('_id', None)
    
    return {"success": True, "user": user_dict}

@api_router.put("/admin/users/{user_id}")
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update user"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Access denied")
    
    db = get_database()
    
    update_dict = {k: v for k, v in user_data.dict().items() if v is not None}
    
    if 'password' in update_dict:
        update_dict['password_hash'] = get_password_hash(update_dict.pop('password'))
    
    if update_dict:
        await db.users.update_one({"id": user_id}, {"$set": update_dict})
    
    user = await get_user_by_id(db, user_id)
    user.pop('password_hash', None)
    user.pop('_id', None)
    
    return {"success": True, "user": user}

@api_router.delete("/admin/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Deactivate user"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Access denied")
    
    db = get_database()
    await db.users.update_one({"id": user_id}, {"$set": {"is_active": False}})
    
    return {"success": True}

# ============================================================================
# ADMIN ROUTES - CSV Import/Export
# ============================================================================

@api_router.post("/admin/users/import")
async def import_users_csv(
    file: UploadFile = File(...),
    role: str = "student",
    current_user: dict = Depends(get_current_user)
):
    """Import users from CSV"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Access denied")
    
    db = get_database()
    
    # Read and parse CSV
    content = await file.read()
    try:
        records = parse_csv_data(content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    added = 0
    skipped = 0
    errors = []
    default_pass = 'faculty@123' if role == 'faculty' else 'student@123'
    
    for rec in records:
        # Extract fields (case-insensitive)
        name = None
        email = None
        for key in rec.keys():
            if key.lower() == 'name':
                name = rec[key]
            elif key.lower() in ['email', 'e-mail', 'email id']:
                email = rec[key]
        
        if not name or not email:
            skipped += 1
            continue
        
        email = email.lower().strip()
        
        # Check if exists
        existing = await get_user_by_email(db, email)
        if existing:
            skipped += 1
            errors.append(f"{name} - email already exists")
            continue
        
        # Create user
        user_doc = {
            "id": str(uuid.uuid4()),
            "name": name.strip(),
            "email": email,
            "password_hash": get_password_hash(default_pass),
            "role": role,
            "is_active": True,
            "must_change_password": True,
            "created_at": datetime.utcnow()
        }
        
        # Add role-specific fields
        if role == 'student':
            user_doc['dept'] = rec.get('Department') or rec.get('department') or 'CS'
            user_doc['batch'] = rec.get('Batch') or rec.get('batch') or '2024-28'
            user_doc['semester'] = int(rec.get('Semester') or rec.get('semester') or 1)
        elif role == 'faculty':
            user_doc['dept'] = rec.get('Department') or rec.get('department') or 'CS'
            user_doc['employee_code'] = str(rec.get('EmployeeCode') or rec.get('E-Code') or rec.get('employee_code') or '')
            user_doc['room_no'] = str(rec.get('Room') or rec.get('room') or '')
            user_doc['mobile'] = str(rec.get('Mobile') or rec.get('mobile') or rec.get('Phone') or '')
        
        await db.users.insert_one(user_doc)
        
        # Create faculty seat
        if role == 'faculty' and user_doc.get('room_no'):
            floor = int(user_doc['room_no'][0]) if user_doc['room_no'][0].isdigit() else 0
            seat = {
                "id": str(uuid.uuid4()),
                "faculty_id": user_doc['id'],
                "building": "Academic Block",
                "floor": floor,
                "room_no": user_doc['room_no'],
                "availability": "available",
                "office_hours": "9AM-5PM",
                "phone": user_doc.get('mobile')
            }
            await db.faculty_seats.insert_one(seat)
        
        added += 1
    
    return {
        "success": True,
        "added": added,
        "skipped": skipped,
        "errors": errors[:10],
        "message": f"{added} {role}s imported successfully. {skipped} skipped.",
        "default_password": default_pass
    }

@api_router.get("/admin/users/export")
async def export_users(
    role: str = "student",
    current_user: dict = Depends(get_current_user)
):
    """Export users to Excel"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Access denied")
    
    db = get_database()
    users = await db.users.find({"role": role, "is_active": True}, {"password_hash": 0, "_id": 0}).to_list(1000)
    
    if role == 'student':
        return export_students_excel(users)
    else:
        return export_faculty_excel(users)

@api_router.get("/admin/templates/{template_type}")
async def download_template(template_type: str):
    """Download CSV templates"""
    if template_type == "student":
        return create_student_template()
    elif template_type == "faculty":
        return create_faculty_template()
    else:
        raise HTTPException(status_code=404, detail="Template not found")

# ============================================================================
# SUBJECTS ROUTES
# ============================================================================

@api_router.get("/subjects")
async def list_subjects(
    dept: Optional[str] = None,
    semester: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    """List all subjects"""
    db = get_database()
    query = {}
    if dept:
        query['dept'] = dept
    if semester:
        query['semester'] = semester
    
    subjects = await db.subjects.find(query, {"_id": 0}).to_list(1000)
    
    # Populate faculty names
    for subj in subjects:
        if subj.get('faculty_id'):
            faculty = await get_user_by_id(db, subj['faculty_id'])
            if faculty:
                subj['faculty_name'] = faculty['name']
    
    return {"subjects": subjects}

@api_router.post("/subjects")
async def create_subject(
    subject_data: SubjectCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create new subject (admin only)"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Access denied")
    
    db = get_database()
    
    # Check if code exists
    existing = await db.subjects.find_one({"code": subject_data.code})
    if existing:
        raise HTTPException(status_code=409, detail="Subject code already exists")
    
    subject_dict = subject_data.dict()
    subject_dict['id'] = str(uuid.uuid4())
    
    await db.subjects.insert_one(subject_dict)
    
    subject_dict.pop('_id', None)
    return {"success": True, "subject": subject_dict}

@api_router.put("/subjects/{subject_id}")
async def update_subject(
    subject_id: str,
    subject_data: SubjectUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update subject (admin only)"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Access denied")
    
    db = get_database()
    
    update_dict = {k: v for k, v in subject_data.dict().items() if v is not None}
    
    if update_dict:
        await db.subjects.update_one({"id": subject_id}, {"$set": update_dict})
    
    subject = await db.subjects.find_one({"id": subject_id}, {"_id": 0})
    return {"success": True, "subject": subject}

@api_router.delete("/subjects/{subject_id}")
async def delete_subject(
    subject_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete subject (admin only)"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Access denied")
    
    db = get_database()
    await db.subjects.delete_one({"id": subject_id})
    
    return {"success": True}

# ============================================================================
# ATTENDANCE ROUTES
# ============================================================================

@api_router.post("/attendance/mark")
async def mark_attendance(
    attendance_data: AttendanceMarkBulk,
    current_user: dict = Depends(get_current_user)
):
    """Mark attendance (faculty/admin)"""
    if current_user['role'] not in ['faculty', 'admin']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    db = get_database()
    
    att_date = attendance_data.date or date.today()
    saved = 0
    
    for record in attendance_data.records:
        # Check if already exists
        existing = await db.attendance.find_one({
            "student_id": record.student_id,
            "subject_id": attendance_data.subject_id,
            "date": att_date.isoformat(),
            "session": attendance_data.session
        })
        
        if existing:
            # Update
            await db.attendance.update_one(
                {"id": existing['id']},
                {"$set": {"status": record.status}}
            )
        else:
            # Insert
            att_doc = {
                "id": str(uuid.uuid4()),
                "student_id": record.student_id,
                "subject_id": attendance_data.subject_id,
                "faculty_id": current_user['user_id'],
                "date": att_date.isoformat(),
                "status": record.status,
                "session": attendance_data.session,
                "created_at": datetime.utcnow()
            }
            await db.attendance.insert_one(att_doc)
            saved += 1
    
    return {"success": True, "saved": saved, "message": f"Attendance saved for {len(attendance_data.records)} students"}

@api_router.get("/attendance/subject/{subject_id}")
async def get_subject_attendance(
    subject_id: str,
    session: str = "09:00-10:00",
    current_user: dict = Depends(get_current_user)
):
    """Get students for attendance marking"""
    if current_user['role'] not in ['faculty', 'admin']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    db = get_database()
    
    # Get subject
    subject = await db.subjects.find_one({"id": subject_id}, {"_id": 0})
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    # Get students
    students = await db.users.find({
        "role": "student",
        "dept": subject['dept'],
        "semester": subject['semester'],
        "is_active": True
    }, {"_id": 0, "password_hash": 0}).to_list(1000)
    
    today = date.today().isoformat()
    
    result = []
    for student in students:
        # Check today's attendance
        existing = await db.attendance.find_one({
            "student_id": student['id'],
            "subject_id": subject_id,
            "date": today,
            "session": session
        })
        
        # Calculate overall attendance
        all_records = await db.attendance.find({
            "student_id": student['id'],
            "subject_id": subject_id
        }).to_list(1000)
        
        total = len(all_records)
        present = sum(1 for r in all_records if r['status'] == 'P')
        overall_pct = round(present / total * 100, 1) if total > 0 else 0
        
        result.append({
            "id": student['id'],
            "name": student['name'],
            "roll": f"STU-{student.get('batch', '2024')[:4]}-{student['id'][-4:]}",
            "current_status": existing['status'] if existing else None,
            "overall_pct": overall_pct
        })
    
    return {"students": result, "subject": subject}

@api_router.get("/attendance/student/{student_id}")
async def get_student_attendance(
    student_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get attendance for a student"""
    # Allow student to view own attendance, or admin/faculty
    if current_user['role'] == 'student' and current_user['user_id'] != student_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    db = get_database()
    
    student = await get_user_by_id(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get subjects for student's dept and semester
    subjects = await db.subjects.find({
        "dept": student['dept'],
        "semester": student['semester']
    }, {"_id": 0}).to_list(1000)
    
    result = []
    for subject in subjects:
        records = await db.attendance.find({
            "student_id": student_id,
            "subject_id": subject['id']
        }).to_list(1000)
        
        total = len(records)
        present = sum(1 for r in records if r['status'] == 'P')
        absent = sum(1 for r in records if r['status'] == 'A')
        leave = sum(1 for r in records if r['status'] == 'L')
        
        pct = round(present / total * 100, 1) if total > 0 else 0
        
        result.append({
            "subject_id": subject['id'],
            "subject": subject['name'],
            "code": subject['code'],
            "total": total,
            "present": present,
            "absent": absent,
            "leave": leave,
            "percentage": pct,
            "status": "danger" if pct < 75 else ("warning" if pct < 85 else "good")
        })
    
    return {"attendance": result}

@api_router.get("/attendance/export")
async def export_attendance(
    subject_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Export attendance to Excel"""
    if current_user['role'] not in ['faculty', 'admin']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    db = get_database()
    
    query = {}
    if subject_id:
        query['subject_id'] = subject_id
    
    records = await db.attendance.find(query, {"_id": 0}).to_list(10000)
    
    # Populate names
    for rec in records:
        student = await get_user_by_id(db, rec['student_id'])
        subject = await db.subjects.find_one({"id": rec['subject_id']})
        rec['student_name'] = student['name'] if student else 'Unknown'
        rec['subject_name'] = subject['name'] if subject else 'Unknown'
    
    return export_attendance_excel(records)

# ============================================================================
# MARKS/GRADES ROUTES
# ============================================================================

@api_router.post("/marks/enter")
async def enter_marks(
    marks_data: MarksEntryBulk,
    current_user: dict = Depends(get_current_user)
):
    """Enter marks (faculty/admin)"""
    if current_user['role'] not in ['faculty', 'admin']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    db = get_database()
    
    saved = 0
    for record in marks_data.records:
        marks = max(0, min(100, record.marks))
        grade, grade_point = calculate_grade(marks)
        
        # Check if exists
        existing = await db.grades.find_one({
            "student_id": record.student_id,
            "subject_id": marks_data.subject_id,
            "semester": marks_data.semester
        })
        
        if existing:
            await db.grades.update_one(
                {"id": existing['id']},
                {"$set": {"marks": marks, "grade": grade, "grade_point": grade_point}}
            )
        else:
            grade_doc = {
                "id": str(uuid.uuid4()),
                "student_id": record.student_id,
                "subject_id": marks_data.subject_id,
                "semester": marks_data.semester,
                "marks": marks,
                "grade": grade,
                "grade_point": grade_point,
                "created_at": datetime.utcnow()
            }
            await db.grades.insert_one(grade_doc)
            saved += 1
    
    return {"success": True, "saved": saved}

@api_router.get("/marks/subject/{subject_id}")
async def get_subject_marks(
    subject_id: str,
    semester: int = 1,
    current_user: dict = Depends(get_current_user)
):
    """Get marks for a subject"""
    if current_user['role'] not in ['faculty', 'admin']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    db = get_database()
    
    subject = await db.subjects.find_one({"id": subject_id}, {"_id": 0})
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    # Get students
    students = await db.users.find({
        "role": "student",
        "dept": subject['dept'],
        "semester": subject['semester'],
        "is_active": True
    }, {"_id": 0, "password_hash": 0}).to_list(1000)
    
    result = []
    for student in students:
        grade_rec = await db.grades.find_one({
            "student_id": student['id'],
            "subject_id": subject_id,
            "semester": semester
        })
        
        result.append({
            "student_id": student['id'],
            "name": student['name'],
            "roll": f"STU-{student.get('batch', '2024')[:4]}-{student['id'][-4:]}",
            "marks": grade_rec['marks'] if grade_rec else None,
            "grade": grade_rec['grade'] if grade_rec else '—',
            "grade_point": grade_rec['grade_point'] if grade_rec else None
        })
    
    return {"subject": subject, "students": result, "semester": semester}

@api_router.get("/marks/student/{student_id}")
async def get_student_marks(
    student_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get marks for a student"""
    # Allow student to view own marks
    if current_user['role'] == 'student' and current_user['user_id'] != student_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    db = get_database()
    
    grades = await db.grades.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    
    # Populate subject names
    for grade in grades:
        subject = await db.subjects.find_one({"id": grade['subject_id']})
        if subject:
            grade['subject_name'] = subject['name']
            grade['subject_code'] = subject['code']
            grade['credits'] = subject['credits']
    
    # Group by semester
    sem_map = {}
    for grade in grades:
        sem = grade['semester']
        if sem not in sem_map:
            sem_map[sem] = []
        sem_map[sem].append(grade)
    
    # Calculate CGPA
    total_points = 0.0
    total_credits = 0
    semesters = {}
    
    for sem, grades_list in sem_map.items():
        sem_points = sum(g['grade_point'] * g.get('credits', 4) for g in grades_list)
        sem_credits = sum(g.get('credits', 4) for g in grades_list)
        sgpa = round(sem_points / sem_credits, 2) if sem_credits > 0 else 0
        
        semesters[f"Semester {sem}"] = grades_list
        total_points += sem_points
        total_credits += sem_credits
    
    cgpa = round(total_points / total_credits, 2) if total_credits > 0 else 0.0
    
    return {
        "semesters": semesters,
        "cgpa": cgpa,
        "total_credits": total_credits
    }

@api_router.get("/marks/export")
async def export_marks(
    subject_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Export marks to Excel"""
    if current_user['role'] not in ['faculty', 'admin']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    db = get_database()
    
    query = {}
    if subject_id:
        query['subject_id'] = subject_id
    
    grades = await db.grades.find(query, {"_id": 0}).to_list(10000)
    
    # Populate names
    for grade in grades:
        student = await get_user_by_id(db, grade['student_id'])
        subject = await db.subjects.find_one({"id": grade['subject_id']})
        grade['student_name'] = student['name'] if student else 'Unknown'
        grade['roll_no'] = f"STU-{student.get('batch', '2024')[:4]}-{student['id'][-4:]}" if student else ''
        grade['subject_name'] = subject['name'] if subject else 'Unknown'
    
    return export_marks_excel(grades)

# ============================================================================
# STUDENT ROUTES
# ============================================================================

@api_router.get("/student/dashboard")
async def student_dashboard(current_user: dict = Depends(get_current_user)):
    """Student dashboard data"""
    if current_user['role'] != 'student':
        raise HTTPException(status_code=403, detail="Access denied")
    
    db = get_database()
    student = await get_user_by_id(db, current_user['user_id'])
    
    # Get CGPA
    marks_data = await get_student_marks(current_user['user_id'], current_user)
    
    # Get attendance
    attendance_data = await get_student_attendance(current_user['user_id'], current_user)
    
    # Get events
    events = await db.events.find({
        "is_active": True,
        "$or": [{"dept": student['dept']}, {"dept": "all"}]
    }, {"_id": 0}).sort("date", 1).limit(5).to_list(10)
    
    # Calculate average attendance
    att_list = attendance_data['attendance']
    avg_att = round(sum(a['percentage'] for a in att_list) / len(att_list), 1) if att_list else 0
    low_att = [a for a in att_list if a['percentage'] < 75]
    
    return {
        "student": {k: v for k, v in student.items() if k != 'password_hash' and k != '_id'},
        "cgpa": marks_data['cgpa'],
        "total_credits": marks_data['total_credits'],
        "avg_attendance": avg_att,
        "low_attendance": low_att,
        "events": events,
        "semesters_completed": max([int(k.split()[1]) for k in marks_data['semesters'].keys()]) if marks_data['semesters'] else 0
    }

# ============================================================================
# EVENTS ROUTES
# ============================================================================

@api_router.get("/events")
async def list_events(
    dept: Optional[str] = None,
    type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List events"""
    db = get_database()
    
    query = {"is_active": True}
    if dept and dept != 'all':
        query["$or"] = [{"dept": dept}, {"dept": "all"}]
    if type and type != 'all':
        query['type'] = type
    
    events = await db.events.find(query, {"_id": 0}).sort("date", 1).to_list(100)
    
    # Format events
    for event in events:
        if isinstance(event['date'], str):
            event_date = datetime.fromisoformat(event['date']).date()
        else:
            event_date = event['date']
        event['date'] = event_date.isoformat()
        event['day'] = event_date.strftime('%d')
        event['month'] = event_date.strftime('%b')
    
    return {"events": events}

@api_router.post("/events")
async def create_event(
    event_data: EventCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create event (admin only)"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Access denied")
    
    db = get_database()
    
    event_dict = event_data.dict()
    event_dict['id'] = str(uuid.uuid4())
    event_dict['posted_by'] = current_user['user_id']
    event_dict['is_active'] = True
    event_dict['created_at'] = datetime.utcnow()
    event_dict['date'] = event_dict['date'].isoformat() if isinstance(event_dict['date'], date) else event_dict['date']
    
    await db.events.insert_one(event_dict)
    
    event_dict.pop('_id', None)
    return {"success": True, "event": event_dict}

@api_router.delete("/events/{event_id}")
async def delete_event(
    event_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete event (admin only)"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Access denied")
    
    db = get_database()
    await db.events.update_one({"id": event_id}, {"$set": {"is_active": False}})
    
    return {"success": True}

# ============================================================================
# ANNOUNCEMENTS ROUTES
# ============================================================================

@api_router.get("/announcements")
async def list_announcements(
    role: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List announcements"""
    db = get_database()
    
    target_role = role or current_user['role']
    
    announcements = await db.announcements.find({
        "is_active": True,
        "$or": [{"target_role": "all"}, {"target_role": target_role}]
    }, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Format dates
    for ann in announcements:
        ann['date'] = ann['created_at'].strftime('%d %b %Y')
    
    return {"announcements": announcements}

@api_router.post("/announcements")
async def create_announcement(
    announcement_data: AnnouncementCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create announcement (admin only)"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Access denied")
    
    db = get_database()
    
    ann_dict = announcement_data.dict()
    ann_dict['id'] = str(uuid.uuid4())
    ann_dict['posted_by'] = current_user['user_id']
    ann_dict['is_active'] = True
    ann_dict['created_at'] = datetime.utcnow()
    
    await db.announcements.insert_one(ann_dict)
    
    ann_dict.pop('_id', None)
    return {"success": True, "announcement": ann_dict}

@api_router.delete("/announcements/{announcement_id}")
async def delete_announcement(
    announcement_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete announcement (admin only)"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Access denied")
    
    db = get_database()
    await db.announcements.update_one({"id": announcement_id}, {"$set": {"is_active": False}})
    
    return {"success": True}

# ============================================================================
# FACULTY SEATS ROUTES
# ============================================================================

@api_router.get("/faculty-seats")
async def list_faculty_seats(
    floor: Optional[int] = None,
    dept: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List faculty seats"""
    db = get_database()
    
    query = {}
    if floor:
        query['floor'] = floor
    
    seats = await db.faculty_seats.find(query, {"_id": 0}).to_list(1000)
    
    # Populate faculty info
    result = []
    for seat in seats:
        faculty = await get_user_by_id(db, seat['faculty_id'])
        if faculty:
            if dept and dept != 'all' and faculty.get('dept') != dept:
                continue
            seat['faculty_name'] = faculty['name']
            seat['dept'] = faculty.get('dept')
            seat['email'] = faculty.get('email')
            result.append(seat)
    
    return {"seats": result}

@api_router.put("/faculty-seats/my")
async def update_my_seat(
    seat_data: FacultySeatUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update faculty's own seat"""
    if current_user['role'] != 'faculty':
        raise HTTPException(status_code=403, detail="Access denied")
    
    db = get_database()
    
    existing = await db.faculty_seats.find_one({"faculty_id": current_user['user_id']})
    
    update_dict = {k: v for k, v in seat_data.dict().items() if v is not None}
    
    if existing:
        if update_dict:
            await db.faculty_seats.update_one(
                {"faculty_id": current_user['user_id']},
                {"$set": update_dict}
            )
    else:
        # Create new seat
        seat_doc = {
            "id": str(uuid.uuid4()),
            "faculty_id": current_user['user_id'],
            "building": "Academic Block",
            **update_dict
        }
        await db.faculty_seats.insert_one(seat_doc)
    
    seat = await db.faculty_seats.find_one({"faculty_id": current_user['user_id']}, {"_id": 0})
    return {"success": True, "seat": seat}

# ============================================================================
# TIMETABLE ROUTES
# ============================================================================

@api_router.get("/timetable")
async def get_timetable(
    dept: Optional[str] = None,
    semester: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get timetable"""
    db = get_database()
    
    query = {}
    if dept:
        query['dept'] = dept
    if semester:
        query['semester'] = semester
    
    slots = await db.timetable.find(query, {"_id": 0}).to_list(1000)
    
    # Populate subject and faculty names
    for slot in slots:
        subject = await db.subjects.find_one({"id": slot['subject_id']})
        if subject:
            slot['subject_name'] = subject['name']
            slot['dept'] = subject['dept']
            slot['semester'] = subject['semester']
            if subject.get('faculty_id'):
                faculty = await get_user_by_id(db, subject['faculty_id'])
                if faculty:
                    slot['faculty_name'] = faculty['name']
    
    # Group by day
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    grouped = {d: [] for d in days}
    for slot in slots:
        if slot['day'] in grouped:
            grouped[slot['day']].append(slot)
    
    # Sort each day by time
    for day in grouped:
        grouped[day].sort(key=lambda x: x['time_start'])
    
    return {"timetable": grouped, "slots": slots}

@api_router.post("/timetable")
async def create_timetable_slot(
    slot_data: TimetableSlotCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create timetable slot (admin only)"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Access denied")
    
    db = get_database()
    
    subject = await db.subjects.find_one({"id": slot_data.subject_id})
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    slot_dict = slot_data.dict()
    slot_dict['id'] = str(uuid.uuid4())
    slot_dict['subject_name'] = subject['name']
    slot_dict['dept'] = subject['dept']
    slot_dict['semester'] = subject['semester']
    slot_dict['faculty_id'] = subject.get('faculty_id')
    
    await db.timetable.insert_one(slot_dict)
    
    slot_dict.pop('_id', None)
    return {"success": True, "slot": slot_dict}

@api_router.delete("/timetable/{slot_id}")
async def delete_timetable_slot(
    slot_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete timetable slot (admin only)"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Access denied")
    
    db = get_database()
    await db.timetable.delete_one({"id": slot_id})
    
    return {"success": True}

# ============================================================================
# SEED DATA (for initial setup)
# ============================================================================

@api_router.post("/seed-database")
async def seed_database():
    """Seed database with initial data (remove in production)"""
    db = get_database()
    
    # Check if already seeded
    admin_exists = await db.users.find_one({"email": "admin@cuchd.in"})
    if admin_exists:
        return {"message": "Database already seeded"}
    
    # Create admin
    admin = {
        "id": str(uuid.uuid4()),
        "name": "Admin",
        "email": "admin@cuchd.in",
        "password_hash": get_password_hash("admin@123"),
        "role": "admin",
        "dept": "Administration",
        "is_active": True,
        "must_change_password": False,
        "created_at": datetime.utcnow()
    }
    await db.users.insert_one(admin)
    
    # Create sample student
    student = {
        "id": str(uuid.uuid4()),
        "name": "Student User",
        "email": "student@cuchd.in",
        "password_hash": get_password_hash("student@123"),
        "role": "student",
        "dept": "CS",
        "batch": "2024-28",
        "semester": 1,
        "is_active": True,
        "must_change_password": False,
        "created_at": datetime.utcnow()
    }
    await db.users.insert_one(student)
    
    # Create sample faculty
    faculty = {
        "id": str(uuid.uuid4()),
        "name": "Dr. Faculty User",
        "email": "faculty@cumail.in",
        "password_hash": get_password_hash("faculty@123"),
        "role": "faculty",
        "dept": "CS",
        "employee_code": "1001",
        "room_no": "510",
        "mobile": "9876543210",
        "is_active": True,
        "must_change_password": False,
        "created_at": datetime.utcnow()
    }
    await db.users.insert_one(faculty)
    
    # Create faculty seat
    seat = {
        "id": str(uuid.uuid4()),
        "faculty_id": faculty['id'],
        "building": "Academic Block",
        "floor": 5,
        "room_no": "510",
        "availability": "available",
        "office_hours": "9AM-5PM",
        "phone": "9876543210"
    }
    await db.faculty_seats.insert_one(seat)
    
    # Create sample announcement
    announcement = {
        "id": str(uuid.uuid4()),
        "title": "Welcome to CampusIQ Portal",
        "body": "Your smart campus management system is now live!",
        "target_role": "all",
        "urgency": "normal",
        "posted_by": admin['id'],
        "is_active": True,
        "created_at": datetime.utcnow()
    }
    await db.announcements.insert_one(announcement)
    
    return {
        "success": True,
        "message": "Database seeded successfully",
        "credentials": {
            "admin": {"email": "admin@cuchd.in", "password": "admin@123"},
            "student": {"email": "student@cuchd.in", "password": "student@123"},
            "faculty": {"email": "faculty@cumail.in", "password": "faculty@123"}
        }
    }

# ============================================================================
# APP SETUP
# ============================================================================

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup/shutdown events
@app.on_event("startup")
async def startup_event():
    await Database.connect_db()
    logging.info("🚀 CampusIQ API Server started")

@app.on_event("shutdown")
async def shutdown_event():
    await Database.close_db()
    logging.info("🔒 CampusIQ API Server shutdown")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# FACULTY SEATING IMPORT
@api_router.post("/admin/faculty-seats/import")
async def import_faculty_seats(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Import faculty seating from Excel"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Access denied")
    
    db = get_database()
    
    # Read and parse file
    content = await file.read()
    try:
        records = parse_csv_data(content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    added = 0
    updated = 0
    errors = []
    
    for rec in records:
        # Extract fields
        name = rec.get('Name') or rec.get('name')
        email = rec.get('Email') or rec.get('email') or rec.get('Email ID')
        ecode = str(rec.get('ECode') or rec.get('ecode') or rec.get('Employee Code') or rec.get('E-Code') or '')
        room = str(rec.get('Seating') or rec.get('seating') or rec.get('Room') or rec.get('room') or '')
        mobile = str(rec.get('Mobile') or rec.get('mobile') or rec.get('Mobile Number') or rec.get('Phone') or '')
        dept = rec.get('Department') or rec.get('department') or rec.get('Dept') or 'General'
        
        if not name or not email:
            errors.append(f"Missing name or email in row")
            continue
        
        email = email.lower().strip()
        
        # Check if faculty user exists
        faculty_user = await db.users.find_one({"email": email, "role": "faculty"})
        
        if not faculty_user:
            # Create faculty user if doesn't exist
            faculty_user = {
                "id": str(uuid.uuid4()),
                "name": name.strip(),
                "email": email,
                "password_hash": get_password_hash("faculty@123"),
                "role": "faculty",
                "dept": dept,
                "employee_code": ecode,
                "room_no": room,
                "mobile": mobile,
                "is_active": True,
                "must_change_password": True,
                "created_at": datetime.utcnow()
            }
            await db.users.insert_one(faculty_user)
        
        # Extract floor from room number
        floor = int(room[0]) if room and room[0].isdigit() else 5
        
        # Check if seat exists for this faculty
        existing_seat = await db.faculty_seats.find_one({"faculty_id": faculty_user['id']})
        
        seat_data = {
            "faculty_id": faculty_user['id'],
            "building": "Academic Block",
            "floor": floor,
            "room_no": room,
            "availability": "available",
            "office_hours": "9:30 AM - 4:30 PM",
            "available_days": "Monday to Friday",
            "phone": mobile,
            "dept": dept
        }
        
        if existing_seat:
            # Update existing
            await db.faculty_seats.update_one(
                {"faculty_id": faculty_user['id']},
                {"$set": seat_data}
            )
            updated += 1
        else:
            # Create new
            seat_data["id"] = str(uuid.uuid4())
            await db.faculty_seats.insert_one(seat_data)
            added += 1
    
    return {
        "success": True,
        "added": added,
        "updated": updated,
        "errors": errors[:10],
        "message": f"{added} faculty seats added, {updated} updated successfully."
    }

@api_router.get("/admin/faculty-seats/template")
async def download_faculty_seats_template():
    """Download faculty seating template"""
    import pandas as pd
    import io
    from fastapi.responses import StreamingResponse
    
    template_data = {
        'Name': ['Dr. John Doe', 'Prof. Jane Smith'],
        'Email': ['john.doe@cumail.in', 'jane.smith@cumail.in'],
        'ECode': ['FAC001', 'FAC002'],
        'Department': ['CS', 'Mathematics'],
        'Seating': ['510', '611'],
        'Mobile': ['9876543210', '9876543211']
    }
    
    df = pd.DataFrame(template_data)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Faculty Seats', index=False)
    output.seek(0)
    
    headers = {
        'Content-Disposition': 'attachment; filename="faculty_seats_template.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
    
    return StreamingResponse(output, headers=headers)

