from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Literal
from datetime import datetime, date
from enum import Enum

# Enums
class UserRole(str, Enum):
    ADMIN = "admin"
    FACULTY = "faculty"
    STUDENT = "student"

class AttendanceStatus(str, Enum):
    PRESENT = "P"
    ABSENT = "A"
    LEAVE = "L"

class EventType(str, Enum):
    EXAM = "exam"
    FEST = "fest"
    WORKSHOP = "workshop"
    ACADEMIC = "academic"

# User Models
class User(BaseModel):
    id: str
    name: str
    email: EmailStr
    password_hash: str
    role: UserRole
    dept: Optional[str] = None
    batch: Optional[str] = None
    semester: Optional[int] = None
    employee_code: Optional[str] = None
    room_no: Optional[str] = None
    mobile: Optional[str] = None
    is_active: bool = True
    must_change_password: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole
    dept: Optional[str] = None
    batch: Optional[str] = None
    semester: Optional[int] = None
    employee_code: Optional[str] = None
    room_no: Optional[str] = None
    mobile: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    dept: Optional[str] = None
    batch: Optional[str] = None
    semester: Optional[int] = None
    employee_code: Optional[str] = None
    room_no: Optional[str] = None
    mobile: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    role: UserRole
    remember: bool = False

class PasswordChange(BaseModel):
    old_password: Optional[str] = None
    new_password: str

# Subject Models
class Subject(BaseModel):
    id: str
    name: str
    code: str
    dept: str
    semester: int
    credits: int = 4
    faculty_id: Optional[str] = None
    faculty_name: Optional[str] = None

class SubjectCreate(BaseModel):
    name: str
    code: str
    dept: str
    semester: int
    credits: int = 4
    faculty_id: Optional[str] = None

class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    dept: Optional[str] = None
    semester: Optional[int] = None
    credits: Optional[int] = None
    faculty_id: Optional[str] = None

# Grade Models
class Grade(BaseModel):
    id: str
    student_id: str
    student_name: Optional[str] = None
    subject_id: str
    subject_name: Optional[str] = None
    semester: int
    marks: float
    grade: str
    grade_point: float
    created_at: datetime = Field(default_factory=datetime.utcnow)

class GradeCreate(BaseModel):
    student_id: str
    subject_id: str
    semester: int
    marks: float

class MarksEntry(BaseModel):
    student_id: str
    marks: float

class MarksEntryBulk(BaseModel):
    subject_id: str
    semester: int
    records: List[MarksEntry]

# Attendance Models
class Attendance(BaseModel):
    id: str
    student_id: str
    student_name: Optional[str] = None
    subject_id: str
    subject_name: Optional[str] = None
    faculty_id: str
    date: date
    status: AttendanceStatus
    session: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AttendanceEntry(BaseModel):
    student_id: str
    status: AttendanceStatus

class AttendanceMarkBulk(BaseModel):
    subject_id: str
    session: str
    date: Optional[date] = None
    records: List[AttendanceEntry]

# Faculty Seat Models
class FacultySeat(BaseModel):
    id: str
    faculty_id: str
    faculty_name: Optional[str] = None
    dept: Optional[str] = None
    building: str = "Academic Block"
    floor: int
    room_no: str
    availability: Literal["available", "occupied", "away"] = "available"
    office_hours: str = "9AM-5PM"
    phone: Optional[str] = None

class FacultySeatUpdate(BaseModel):
    floor: Optional[int] = None
    room_no: Optional[str] = None
    availability: Optional[Literal["available", "occupied", "away"]] = None
    office_hours: Optional[str] = None
    phone: Optional[str] = None

# Event Models
class Event(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    date: date
    time: Optional[str] = None
    venue: Optional[str] = None
    link: Optional[str] = None
    dept: str = "all"
    type: EventType
    posted_by: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    date: date
    time: Optional[str] = None
    venue: Optional[str] = None
    link: Optional[str] = None
    dept: str = "all"
    type: EventType

# Announcement Models
class Announcement(BaseModel):
    id: str
    title: str
    body: Optional[str] = None
    target_role: Literal["all", "student", "faculty", "admin"] = "all"
    urgency: Literal["normal", "high"] = "normal"
    posted_by: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AnnouncementCreate(BaseModel):
    title: str
    body: Optional[str] = None
    target_role: Literal["all", "student", "faculty", "admin"] = "all"
    urgency: Literal["normal", "high"] = "normal"

# Timetable Models
class TimetableSlot(BaseModel):
    id: str
    day: Literal["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    time_start: str
    time_end: str
    subject_id: str
    subject_name: Optional[str] = None
    dept: Optional[str] = None
    semester: Optional[int] = None
    room: str = "TBD"
    faculty_id: Optional[str] = None
    faculty_name: Optional[str] = None

class TimetableSlotCreate(BaseModel):
    day: Literal["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    time_start: str
    time_end: str
    subject_id: str
    room: str = "TBD"

# CSV Import Models
class CSVImportRequest(BaseModel):
    role: UserRole
    records: List[dict]
