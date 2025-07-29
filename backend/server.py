from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, List
import os
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from bson import ObjectId
import uuid

# Load environment variables
load_dotenv()

app = FastAPI(title="Track My Academy API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/token")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL")
client = MongoClient(MONGO_URL)
db = client.track_my_academy

# Collections
users_collection = db.users
academies_collection = db.academies
coaches_collection = db.coaches
students_collection = db.students
sessions_collection = db.sessions
attendance_collection = db.attendance
performance_history_collection = db.performance_history

# Pydantic Models
class UserBase(BaseModel):
    email: str
    role: str  # admin, coach, student
    name: str

class UserCreate(UserBase):
    password: str
    academy_id: Optional[str] = None

class User(UserBase):
    user_id: str
    academy_id: Optional[str] = None
    is_active: bool = True
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class AcademyBase(BaseModel):
    academy_name: str
    academy_location: str
    academy_logo_url: Optional[str] = None
    admin_email: str

class AcademyCreate(AcademyBase):
    pass

class Academy(AcademyBase):
    academy_id: str
    created_at: datetime

class CoachBase(BaseModel):
    name: str
    email: str
    specialization: str
    profile_pic: Optional[str] = None
    bio: Optional[str] = None

class CoachCreate(CoachBase):
    academy_id: str
    password: str

class Coach(CoachBase):
    coach_id: str
    academy_id: str
    created_at: datetime

class StudentBase(BaseModel):
    name: str
    email: str
    age: int
    parent_contact: str
    enrolled_program: str
    performance_score: float = 0.0
    photo: Optional[str] = None

class StudentCreate(StudentBase):
    academy_id: str
    password: str
    assigned_coaches: List[str] = []

class Student(StudentBase):
    student_id: str
    academy_id: str
    assigned_coaches: List[str] = []
    created_at: datetime

# Session Management Models
class SessionBase(BaseModel):
    session_name: str
    description: Optional[str] = None
    session_date: datetime
    start_time: str  # HH:MM format
    end_time: str    # HH:MM format
    location: Optional[str] = None
    max_participants: Optional[int] = None
    session_type: str  # training, match, practice, etc.

class SessionCreate(SessionBase):
    academy_id: str
    coach_id: str
    assigned_students: List[str] = []

class Session(SessionBase):
    session_id: str
    academy_id: str
    coach_id: str
    assigned_students: List[str] = []
    created_at: datetime
    status: str = "scheduled"  # scheduled, ongoing, completed, cancelled

# Attendance Models
class AttendanceBase(BaseModel):
    session_id: str
    student_id: str
    status: str  # present, absent, late, excused
    notes: Optional[str] = None

class AttendanceCreate(AttendanceBase):
    pass

class Attendance(AttendanceBase):
    attendance_id: str
    marked_by: str  # coach_id who marked attendance
    marked_at: datetime

# Performance History Models
class PerformanceHistoryBase(BaseModel):
    student_id: str
    session_id: Optional[str] = None
    performance_score: float
    performance_notes: Optional[str] = None
    assessment_type: str  # session, monthly, quarterly, annual
    assessed_by: str  # coach_id

class PerformanceHistoryCreate(PerformanceHistoryBase):
    pass

class PerformanceHistory(PerformanceHistoryBase):
    performance_id: str
    created_at: datetime

# Analytics Models
class AttendanceAnalytics(BaseModel):
    student_id: str
    student_name: str
    total_sessions: int
    attended_sessions: int
    attendance_percentage: float
    recent_attendance: List[dict]  # Last 10 sessions

class PerformanceAnalytics(BaseModel):
    student_id: str
    student_name: str
    current_score: float
    average_score: float
    score_trend: str  # improving, declining, stable
    performance_history: List[dict]

# Utility functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = users_collection.find_one({"email": email})
    if user is None:
        raise credentials_exception
    
    return User(
        user_id=user["user_id"],
        email=user["email"],
        role=user["role"],
        name=user["name"],
        academy_id=user.get("academy_id"),
        is_active=user.get("is_active", True),
        created_at=user["created_at"]
    )

# Authentication endpoints
@app.post("/api/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = users_collection.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

# Academy endpoints
@app.post("/api/academies", response_model=Academy)
async def create_academy(academy: AcademyCreate):
    academy_id = str(uuid.uuid4())
    academy_doc = {
        "academy_id": academy_id,
        "academy_name": academy.academy_name,
        "academy_location": academy.academy_location,
        "academy_logo_url": academy.academy_logo_url,
        "admin_email": academy.admin_email,
        "created_at": datetime.now(timezone.utc)
    }
    
    academies_collection.insert_one(academy_doc)
    
    return Academy(**academy_doc)

@app.get("/api/academies", response_model=List[Academy])
async def get_academies(current_user: User = Depends(get_current_user)):
    if current_user.role == "admin":
        academies = list(academies_collection.find({"admin_email": current_user.email}))
    else:
        # For coaches and students, return their academy
        if current_user.academy_id:
            academies = list(academies_collection.find({"academy_id": current_user.academy_id}))
        else:
            academies = []
    
    return [Academy(**academy) for academy in academies]

@app.get("/api/academies/{academy_id}", response_model=Academy)
async def get_academy(academy_id: str, current_user: User = Depends(get_current_user)):
    # Check permissions
    if current_user.role == "admin":
        academy = academies_collection.find_one({"academy_id": academy_id, "admin_email": current_user.email})
    else:
        if current_user.academy_id != academy_id:
            raise HTTPException(status_code=403, detail="Access denied")
        academy = academies_collection.find_one({"academy_id": academy_id})
    
    if not academy:
        raise HTTPException(status_code=404, detail="Academy not found")
    
    return Academy(**academy)

# Coach endpoints
@app.post("/api/coaches", response_model=Coach)
async def create_coach(coach: CoachCreate, current_user: User = Depends(get_current_user)):
    # Only admins can create coaches
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create coaches")
    
    # Verify admin owns the academy
    academy = academies_collection.find_one({"academy_id": coach.academy_id, "admin_email": current_user.email})
    if not academy:
        raise HTTPException(status_code=403, detail="Access denied")
    
    coach_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    
    # Create user account for coach
    user_doc = {
        "user_id": user_id,
        "email": coach.email,
        "role": "coach",
        "name": coach.name,
        "academy_id": coach.academy_id,
        "hashed_password": get_password_hash(coach.password),
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    }
    
    # Create coach profile
    coach_doc = {
        "coach_id": coach_id,
        "name": coach.name,
        "email": coach.email,
        "specialization": coach.specialization,
        "profile_pic": coach.profile_pic,
        "bio": coach.bio,
        "academy_id": coach.academy_id,
        "created_at": datetime.now(timezone.utc)
    }
    
    users_collection.insert_one(user_doc)
    coaches_collection.insert_one(coach_doc)
    
    return Coach(**coach_doc)

@app.get("/api/coaches", response_model=List[Coach])
async def get_coaches(current_user: User = Depends(get_current_user)):
    if current_user.role == "admin":
        # Admin can see coaches in their academies
        admin_academies = list(academies_collection.find({"admin_email": current_user.email}))
        academy_ids = [academy["academy_id"] for academy in admin_academies]
        coaches = list(coaches_collection.find({"academy_id": {"$in": academy_ids}}))
    elif current_user.role == "coach":
        # Coach can see themselves and other coaches in their academy
        coaches = list(coaches_collection.find({"academy_id": current_user.academy_id}))
    else:
        # Students can see coaches in their academy
        coaches = list(coaches_collection.find({"academy_id": current_user.academy_id}))
    
    return [Coach(**coach) for coach in coaches]

# Student endpoints
@app.post("/api/students", response_model=Student)
async def create_student(student: StudentCreate, current_user: User = Depends(get_current_user)):
    # Only admins can create students
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create students")
    
    # Verify admin owns the academy
    academy = academies_collection.find_one({"academy_id": student.academy_id, "admin_email": current_user.email})
    if not academy:
        raise HTTPException(status_code=403, detail="Access denied")
    
    student_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    
    # Create user account for student
    user_doc = {
        "user_id": user_id,
        "email": student.email,
        "role": "student",
        "name": student.name,
        "academy_id": student.academy_id,
        "hashed_password": get_password_hash(student.password),
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    }
    
    # Create student profile
    student_doc = {
        "student_id": student_id,
        "name": student.name,
        "email": student.email,
        "age": student.age,
        "parent_contact": student.parent_contact,
        "enrolled_program": student.enrolled_program,
        "performance_score": student.performance_score,
        "photo": student.photo,
        "academy_id": student.academy_id,
        "assigned_coaches": student.assigned_coaches,
        "created_at": datetime.now(timezone.utc)
    }
    
    users_collection.insert_one(user_doc)
    students_collection.insert_one(student_doc)
    
    return Student(**student_doc)

@app.get("/api/students", response_model=List[Student])
async def get_students(current_user: User = Depends(get_current_user)):
    if current_user.role == "admin":
        # Admin can see students in their academies
        admin_academies = list(academies_collection.find({"admin_email": current_user.email}))
        academy_ids = [academy["academy_id"] for academy in admin_academies]
        students = list(students_collection.find({"academy_id": {"$in": academy_ids}}))
    elif current_user.role == "coach":
        # Coach can see their assigned students
        coach = coaches_collection.find_one({"email": current_user.email})
        if coach:
            students = list(students_collection.find({"assigned_coaches": coach["coach_id"]}))
        else:
            students = []
    else:
        # Students can only see themselves
        students = list(students_collection.find({"email": current_user.email}))
    
    return [Student(**student) for student in students]

# Assign coach to student
@app.post("/api/students/{student_id}/assign-coach/{coach_id}")
async def assign_coach_to_student(student_id: str, coach_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can assign coaches")
    
    # Verify student and coach exist and belong to admin's academy
    student = students_collection.find_one({"student_id": student_id})
    coach = coaches_collection.find_one({"coach_id": coach_id})
    
    if not student or not coach:
        raise HTTPException(status_code=404, detail="Student or coach not found")
    
    # Verify admin owns the academy
    academy = academies_collection.find_one({"academy_id": student["academy_id"], "admin_email": current_user.email})
    if not academy or coach["academy_id"] != student["academy_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Add coach to student's assigned coaches if not already assigned
    if coach_id not in student["assigned_coaches"]:
        students_collection.update_one(
            {"student_id": student_id},
            {"$push": {"assigned_coaches": coach_id}}
        )
    
    return {"message": "Coach assigned successfully"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc)}

# Session Management Endpoints
@app.post("/api/sessions", response_model=Session)
async def create_session(session: SessionCreate, current_user: User = Depends(get_current_user)):
    # Only admins and coaches can create sessions
    if current_user.role not in ["admin", "coach"]:
        raise HTTPException(status_code=403, detail="Only admins and coaches can create sessions")
    
    # Verify permissions
    if current_user.role == "admin":
        # Admin can create sessions for any academy they manage
        academy = academies_collection.find_one({"academy_id": session.academy_id, "admin_email": current_user.email})
        if not academy:
            raise HTTPException(status_code=403, detail="Access denied")
    else:
        # Coach can only create sessions in their academy
        if current_user.academy_id != session.academy_id:
            raise HTTPException(status_code=403, detail="Access denied")
    
    session_id = str(uuid.uuid4())
    session_doc = {
        "session_id": session_id,
        "session_name": session.session_name,
        "description": session.description,
        "session_date": session.session_date,
        "start_time": session.start_time,
        "end_time": session.end_time,
        "location": session.location,
        "max_participants": session.max_participants,
        "session_type": session.session_type,
        "academy_id": session.academy_id,
        "coach_id": session.coach_id,
        "assigned_students": session.assigned_students,
        "status": "scheduled",
        "created_at": datetime.now(timezone.utc)
    }
    
    sessions_collection.insert_one(session_doc)
    return Session(**session_doc)

@app.get("/api/sessions", response_model=List[Session])
async def get_sessions(current_user: User = Depends(get_current_user)):
    if current_user.role == "admin":
        # Admin can see sessions in their academies
        admin_academies = list(academies_collection.find({"admin_email": current_user.email}))
        academy_ids = [academy["academy_id"] for academy in admin_academies]
        sessions = list(sessions_collection.find({"academy_id": {"$in": academy_ids}}))
    elif current_user.role == "coach":
        # Coach can see sessions in their academy or sessions they're assigned to
        sessions = list(sessions_collection.find({
            "$or": [
                {"academy_id": current_user.academy_id},
                {"coach_id": current_user.email}
            ]
        }))
    else:
        # Students can see sessions they're assigned to
        student = students_collection.find_one({"email": current_user.email})
        if student:
            sessions = list(sessions_collection.find({"assigned_students": student["student_id"]}))
        else:
            sessions = []
    
    return [Session(**session) for session in sessions]

@app.get("/api/sessions/{session_id}", response_model=Session)
async def get_session(session_id: str, current_user: User = Depends(get_current_user)):
    session = sessions_collection.find_one({"session_id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check permissions
    if current_user.role == "admin":
        academy = academies_collection.find_one({"academy_id": session["academy_id"], "admin_email": current_user.email})
        if not academy:
            raise HTTPException(status_code=403, detail="Access denied")
    elif current_user.role == "coach":
        if session["academy_id"] != current_user.academy_id and session["coach_id"] != current_user.email:
            raise HTTPException(status_code=403, detail="Access denied")
    else:
        # Student can only see sessions they're assigned to
        student = students_collection.find_one({"email": current_user.email})
        if not student or student["student_id"] not in session["assigned_students"]:
            raise HTTPException(status_code=403, detail="Access denied")
    
    return Session(**session)

@app.put("/api/sessions/{session_id}", response_model=Session)
async def update_session(session_id: str, session_update: SessionCreate, current_user: User = Depends(get_current_user)):
    # Only admins and coaches can update sessions
    if current_user.role not in ["admin", "coach"]:
        raise HTTPException(status_code=403, detail="Only admins and coaches can update sessions")
    
    existing_session = sessions_collection.find_one({"session_id": session_id})
    if not existing_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check permissions
    if current_user.role == "coach" and existing_session["coach_id"] != current_user.email:
        raise HTTPException(status_code=403, detail="Access denied")
    
    updated_session = {
        "session_name": session_update.session_name,
        "description": session_update.description,
        "session_date": session_update.session_date,
        "start_time": session_update.start_time,
        "end_time": session_update.end_time,
        "location": session_update.location,
        "max_participants": session_update.max_participants,
        "session_type": session_update.session_type,
        "assigned_students": session_update.assigned_students,
    }
    
    sessions_collection.update_one(
        {"session_id": session_id},
        {"$set": updated_session}
    )
    
    updated_doc = sessions_collection.find_one({"session_id": session_id})
    return Session(**updated_doc)

# Attendance Management Endpoints
@app.post("/api/attendance", response_model=Attendance)
async def mark_attendance(attendance: AttendanceCreate, current_user: User = Depends(get_current_user)):
    # Only coaches can mark attendance
    if current_user.role != "coach":
        raise HTTPException(status_code=403, detail="Only coaches can mark attendance")
    
    # Verify session exists and coach has permission
    session = sessions_collection.find_one({"session_id": attendance.session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session["coach_id"] != current_user.email and session["academy_id"] != current_user.academy_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Check if attendance already marked for this student in this session
    existing_attendance = attendance_collection.find_one({
        "session_id": attendance.session_id,
        "student_id": attendance.student_id
    })
    
    attendance_id = str(uuid.uuid4())
    coach = coaches_collection.find_one({"email": current_user.email})
    
    attendance_doc = {
        "attendance_id": attendance_id,
        "session_id": attendance.session_id,
        "student_id": attendance.student_id,
        "status": attendance.status,
        "notes": attendance.notes,
        "marked_by": coach["coach_id"] if coach else current_user.user_id,
        "marked_at": datetime.now(timezone.utc)
    }
    
    if existing_attendance:
        # Update existing attendance
        attendance_collection.update_one(
            {"session_id": attendance.session_id, "student_id": attendance.student_id},
            {"$set": attendance_doc}
        )
        attendance_doc["attendance_id"] = existing_attendance["attendance_id"]
    else:
        # Create new attendance record
        attendance_collection.insert_one(attendance_doc)
    
    return Attendance(**attendance_doc)

@app.get("/api/sessions/{session_id}/attendance", response_model=List[Attendance])
async def get_session_attendance(session_id: str, current_user: User = Depends(get_current_user)):
    # Verify session exists and user has permission
    session = sessions_collection.find_one({"session_id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check permissions
    if current_user.role == "admin":
        academy = academies_collection.find_one({"academy_id": session["academy_id"], "admin_email": current_user.email})
        if not academy:
            raise HTTPException(status_code=403, detail="Access denied")
    elif current_user.role == "coach":
        if session["academy_id"] != current_user.academy_id:
            raise HTTPException(status_code=403, detail="Access denied")
    else:
        raise HTTPException(status_code=403, detail="Access denied")
    
    attendance_records = list(attendance_collection.find({"session_id": session_id}))
    return [Attendance(**record) for record in attendance_records]

# Performance History Endpoints
@app.post("/api/performance-history", response_model=PerformanceHistory)
async def create_performance_record(performance: PerformanceHistoryCreate, current_user: User = Depends(get_current_user)):
    # Only coaches can create performance records
    if current_user.role != "coach":
        raise HTTPException(status_code=403, detail="Only coaches can create performance records")
    
    coach = coaches_collection.find_one({"email": current_user.email})
    if not coach:
        raise HTTPException(status_code=404, detail="Coach not found")
    
    performance_id = str(uuid.uuid4())
    performance_doc = {
        "performance_id": performance_id,
        "student_id": performance.student_id,
        "session_id": performance.session_id,
        "performance_score": performance.performance_score,
        "performance_notes": performance.performance_notes,
        "assessment_type": performance.assessment_type,
        "assessed_by": coach["coach_id"],
        "created_at": datetime.now(timezone.utc)
    }
    
    performance_history_collection.insert_one(performance_doc)
    
    # Update student's current performance score
    students_collection.update_one(
        {"student_id": performance.student_id},
        {"$set": {"performance_score": performance.performance_score}}
    )
    
    return PerformanceHistory(**performance_doc)

@app.get("/api/students/{student_id}/performance-history", response_model=List[PerformanceHistory])
async def get_student_performance_history(student_id: str, current_user: User = Depends(get_current_user)):
    # Check permissions
    if current_user.role == "student":
        student = students_collection.find_one({"email": current_user.email})
        if not student or student["student_id"] != student_id:
            raise HTTPException(status_code=403, detail="Access denied")
    elif current_user.role == "coach":
        # Coach can see performance of their assigned students
        student = students_collection.find_one({"student_id": student_id})
        if not student or current_user.academy_id != student["academy_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
    elif current_user.role == "admin":
        # Admin can see performance of students in their academies
        student = students_collection.find_one({"student_id": student_id})
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        academy = academies_collection.find_one({"academy_id": student["academy_id"], "admin_email": current_user.email})
        if not academy:
            raise HTTPException(status_code=403, detail="Access denied")
    
    performance_records = list(performance_history_collection.find({"student_id": student_id}).sort("created_at", -1))
    return [PerformanceHistory(**record) for record in performance_records]

# Analytics Endpoints
@app.get("/api/analytics/attendance/{student_id}", response_model=AttendanceAnalytics)
async def get_student_attendance_analytics(student_id: str, current_user: User = Depends(get_current_user)):
    # Check permissions (same as performance history)
    student = students_collection.find_one({"student_id": student_id})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    if current_user.role == "student":
        if student["email"] != current_user.email:
            raise HTTPException(status_code=403, detail="Access denied")
    elif current_user.role == "coach":
        if current_user.academy_id != student["academy_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
    elif current_user.role == "admin":
        academy = academies_collection.find_one({"academy_id": student["academy_id"], "admin_email": current_user.email})
        if not academy:
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Get all sessions assigned to student
    assigned_sessions = list(sessions_collection.find({"assigned_students": student_id}))
    total_sessions = len(assigned_sessions)
    
    # Get attendance records
    attendance_records = list(attendance_collection.find({"student_id": student_id}))
    attended_sessions = len([record for record in attendance_records if record["status"] == "present"])
    
    attendance_percentage = (attended_sessions / total_sessions * 100) if total_sessions > 0 else 0
    
    # Get recent attendance (last 10 sessions)
    recent_sessions = sorted(assigned_sessions, key=lambda x: x["session_date"], reverse=True)[:10]
    recent_attendance = []
    
    for session in recent_sessions:
        attendance_record = next((record for record in attendance_records if record["session_id"] == session["session_id"]), None)
        recent_attendance.append({
            "session_name": session["session_name"],
            "session_date": session["session_date"].isoformat(),
            "status": attendance_record["status"] if attendance_record else "not_marked"
        })
    
    return AttendanceAnalytics(
        student_id=student_id,
        student_name=student["name"],
        total_sessions=total_sessions,
        attended_sessions=attended_sessions,
        attendance_percentage=round(attendance_percentage, 2),
        recent_attendance=recent_attendance
    )

@app.get("/api/analytics/performance/{student_id}", response_model=PerformanceAnalytics)
async def get_student_performance_analytics(student_id: str, current_user: User = Depends(get_current_user)):
    # Check permissions (same as above)
    student = students_collection.find_one({"student_id": student_id})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    if current_user.role == "student":
        if student["email"] != current_user.email:
            raise HTTPException(status_code=403, detail="Access denied")
    elif current_user.role == "coach":
        if current_user.academy_id != student["academy_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
    elif current_user.role == "admin":
        academy = academies_collection.find_one({"academy_id": student["academy_id"], "admin_email": current_user.email})
        if not academy:
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Get performance history
    performance_records = list(performance_history_collection.find({"student_id": student_id}).sort("created_at", -1))
    
    current_score = student["performance_score"]
    
    if performance_records:
        scores = [record["performance_score"] for record in performance_records]
        average_score = sum(scores) / len(scores)
        
        # Determine trend (comparing last 3 records with previous 3)
        if len(scores) >= 6:
            recent_avg = sum(scores[:3]) / 3
            previous_avg = sum(scores[3:6]) / 3
            if recent_avg > previous_avg + 0.5:
                trend = "improving"
            elif recent_avg < previous_avg - 0.5:
                trend = "declining"
            else:
                trend = "stable"
        else:
            trend = "stable"
        
        # Format performance history for frontend
        performance_history = []
        for record in performance_records[-10:]:  # Last 10 records
            performance_history.append({
                "date": record["created_at"].isoformat(),
                "score": record["performance_score"],
                "assessment_type": record["assessment_type"],
                "notes": record.get("performance_notes", "")
            })
    else:
        average_score = current_score
        trend = "stable"
        performance_history = []
    
    return PerformanceAnalytics(
        student_id=student_id,
        student_name=student["name"],
        current_score=current_score,
        average_score=round(average_score, 2),
        score_trend=trend,
        performance_history=performance_history
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)