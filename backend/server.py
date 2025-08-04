from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, List
import os
import shutil
from pathlib import Path
from dotenv import load_dotenv
from pydantic import BaseModel, Field, EmailStr
from bson import ObjectId
import uuid
import httpx
import time
from decouple import config
import logging

# Import the correct Supabase authentication dependencies
from auth.supabase_auth import supabase_auth, JWTBearer, require_super_admin, require_admin, require_coach_or_admin

# Load environment variables
load_dotenv()

# Configure logging for production
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Track My Academy API",
    version="1.0.0",
    description="Sports Academy Management Platform",
    docs_url="/docs" if os.getenv("ENVIRONMENT") != "production" else None,
    redoc_url="/redoc" if os.getenv("ENVIRONMENT") != "production" else None
)

# Create uploads directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Mount static file serving
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Production-ready CORS configuration
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
if ENVIRONMENT == "production":
    allowed_origins = os.getenv("CORS_ORIGINS", "https://track-my-academy.vercel.app,https://track-my-academy-backend.onrender.com").split(",")
    allowed_origins = [origin.strip() for origin in allowed_origins]
else:
    allowed_origins = ["*"]

logger.info(f"Environment: {ENVIRONMENT}")
logger.info(f"Allowed CORS origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Security
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable is required")

ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# MongoDB connection with error handling
MONGO_URL = os.getenv("MONGO_URL")
if not MONGO_URL:
    raise ValueError("MONGO_URL environment variable is required")

try:
    client = MongoClient(MONGO_URL)
    client.admin.command('ismaster')
    db = client.track_my_academy
    logger.info("Connected to MongoDB successfully")
except Exception as e:
    logger.error(f"Failed to connect to MongoDB: {e}")
    raise

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
    role: str
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
    owner_name: str
    admin_contact: str
    admin_email: str
    student_limit: int
    coach_limit: int
    subscription_start_date: datetime
    subscription_expiry_date: datetime
    branches: List[str] = []
    academy_logo_url: Optional[str] = None

class AcademyCreate(AcademyBase):
    pass

class Academy(AcademyBase):
    academy_id: str
    created_at: datetime
    status: Optional[str] = None

    class Config:
        extra = "ignore" # FINAL FIX: Ignore extra fields like `_id` from MongoDB

class AcademyUpdate(BaseModel):
    academy_name: Optional[str] = None
    academy_location: Optional[str] = None
    owner_name: Optional[str] = None
    admin_contact: Optional[str] = None
    admin_email: Optional[str] = None
    student_limit: Optional[int] = None
    coach_limit: Optional[int] = None
    subscription_start_date: Optional[datetime] = None
    subscription_expiry_date: Optional[datetime] = None
    branches: Optional[List[str]] = None
    academy_logo_url: Optional[str] = None

# ... (rest of the models are unchanged)

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

class SessionBase(BaseModel):
    session_name: str
    description: Optional[str] = None
    session_date: datetime
    start_time: str
    end_time: str
    location: Optional[str] = None
    max_participants: Optional[int] = None
    session_type: str

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
    status: str = "scheduled"

class AttendanceBase(BaseModel):
    session_id: str
    student_id: str
    status: str
    notes: Optional[str] = None

class AttendanceCreate(AttendanceBase):
    pass

class Attendance(AttendanceBase):
    attendance_id: str
    marked_by: str
    marked_at: datetime

class PerformanceHistoryBase(BaseModel):
    student_id: str
    session_id: Optional[str] = None
    performance_score: float
    performance_notes: Optional[str] = None
    assessment_type: str
    assessed_by: str

class PerformanceHistoryCreate(PerformanceHistoryBase):
    pass

class PerformanceHistory(PerformanceHistoryBase):
    performance_id: str
    created_at: datetime

class UserSignUp(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: str = "student"

class UserSignIn(BaseModel):
    email: EmailStr
    password: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordUpdateRequest(BaseModel):
    password: str
    confirm_password: str

class AuthResponse(BaseModel):
    message: str
    success: bool
    user: Optional[dict] = None

class AttendanceAnalytics(BaseModel):
    student_id: str
    student_name: str
    total_sessions: int
    attended_sessions: int
    attendance_percentage: float
    recent_attendance: List[dict]

class PerformanceAnalytics(BaseModel):
    student_id: str
    student_name: str
    current_score: float
    average_score: float
    score_trend: str
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

def calculate_academy_status(subscription_expiry_date: datetime) -> str:
    now = datetime.now(timezone.utc)
    if subscription_expiry_date.tzinfo is None:
        subscription_expiry_date = subscription_expiry_date.replace(tzinfo=timezone.utc)
    if now > subscription_expiry_date:
        return "expired"
    elif (subscription_expiry_date - now).days <= 10:
        return "expiring_soon"
    else:
        return "active"

# Authentication endpoints
@app.post("/api/auth/signup", response_model=AuthResponse)
async def signup(user_data: UserSignUp):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{config('SUPABASE_URL')}/auth/v1/admin/users",
                json={
                    "email": user_data.email,
                    "password": user_data.password,
                    "email_confirm": True,
                    "user_metadata": {
                        "first_name": user_data.first_name,
                        "last_name": user_data.last_name,
                        "role": user_data.role
                    }
                },
                headers={
                    "apikey": config("SUPABASE_SERVICE_ROLE_KEY"),
                    "Authorization": f"Bearer {config('SUPABASE_SERVICE_ROLE_KEY')}",
                    "Content-Type": "application/json"
                }
            )
            if response.status_code != 200:
                error_data = response.json()
                logger.error(f"Supabase signup error: {error_data}")
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_data.get("msg", "Failed to create user in Supabase"))
            supabase_user = response.json()
        user_profile = {
            "user_id": supabase_user["id"], "email": user_data.email,
            "first_name": user_data.first_name, "last_name": user_data.last_name,
            "name": f"{user_data.first_name} {user_data.last_name}".strip(),
            "role": user_data.role, "created_at": datetime.now(timezone.utc),
            "is_active": True, "academy_id": None
        }
        users_collection.insert_one(user_profile)
        logger.info(f"User created successfully: {user_data.email}")
        return AuthResponse(message="Account created successfully! You can now sign in.", success=True, user={"id": supabase_user["id"], "email": user_data.email, "first_name": user_data.first_name, "last_name": user_data.last_name, "role": user_data.role})
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating account: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error creating account: {str(e)}")

@app.post("/api/auth/signin", response_model=AuthResponse)
async def signin(credentials: UserSignIn):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{config('SUPABASE_URL')}/auth/v1/token?grant_type=password",
                json={"email": credentials.email, "password": credentials.password},
                headers={"apikey": config("SUPABASE_ANON_KEY"), "Content-Type": "application/json"}
            )
            if response.status_code != 200:
                error_data = response.json()
                logger.warning(f"Failed login attempt for {credentials.email}: {error_data.get('error_description', 'Invalid credentials')}")
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=error_data.get("error_description", "Invalid credentials"))
            auth_data = response.json()
            user_profile = users_collection.find_one({"user_id": auth_data["user"]["id"]})
            if not user_profile:
                user_profile = {
                    "user_id": auth_data["user"]["id"], "email": auth_data["user"]["email"],
                    "first_name": auth_data["user"]["user_metadata"].get("first_name", ""),
                    "last_name": auth_data["user"]["user_metadata"].get("last_name", ""),
                    "name": f"{auth_data['user']['user_metadata'].get('first_name', '')} {auth_data['user']['user_metadata'].get('last_name', '')}".strip() or auth_data["user"]["email"].split("@")[0],
                    "role": auth_data["user"]["user_metadata"].get("role", "student"),
                    "created_at": datetime.now(timezone.utc), "is_active": True, "academy_id": None
                }
                users_collection.insert_one(user_profile)
            logger.info(f"User signed in successfully: {credentials.email}")
            return AuthResponse(message="Successfully signed in!", success=True, user={"id": auth_data["user"]["id"], "email": auth_data["user"]["email"], "access_token": auth_data["access_token"], "refresh_token": auth_data["refresh_token"], "expires_in": auth_data["expires_in"], "token_type": auth_data["token_type"], "first_name": user_profile.get("first_name", ""), "last_name": user_profile.get("last_name", ""), "name": user_profile.get("name", ""), "role": user_profile.get("role", "student"), "academy_id": user_profile.get("academy_id")})
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error signing in: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error signing in: {str(e)}")

@app.get("/api/auth/profile", response_model=AuthResponse)
async def get_user_profile(current_user: dict = Depends(JWTBearer())):
    try:
        user_profile = users_collection.find_one({"user_id": current_user["user_id"]})
        if not user_profile:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User profile not found")
        return AuthResponse(message="Profile retrieved successfully", success=True, user={"user_id": user_profile["user_id"], "email": user_profile["email"], "first_name": user_profile.get("first_name", ""), "last_name": user_profile.get("last_name", ""), "name": user_profile.get("name", ""), "role": user_profile.get("role", "student"), "academy_id": user_profile.get("academy_id"), "is_active": user_profile.get("is_active", True)})
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving profile: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error retrieving profile: {str(e)}")

# ... (rest of the file is unchanged, including all endpoints)

@app.post("/api/upload-academy-logo")
async def upload_academy_logo(file: UploadFile = File(...), current_user: dict = Depends(require_super_admin())):
    allowed_types = ["image/jpeg", "image/jpg", "image/png"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only PNG and JPG files are allowed")
    file_extension = file.filename.split(".")[-1].lower()
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to save file")
    file_url = f"/uploads/{unique_filename}"
    return {"file_url": file_url}

@app.post("/api/super-admin/academies")
async def create_academy_super_admin(academy: AcademyCreate, current_user: dict = Depends(require_super_admin())):
    academy_id = str(uuid.uuid4())
    import secrets
    import string
    admin_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{config('SUPABASE_URL')}/auth/v1/admin/users",
                json={
                    "email": academy.admin_email, "password": admin_password, "email_confirm": True,
                    "user_metadata": {"first_name": academy.owner_name.split()[0] if academy.owner_name else "Academy", "last_name": academy.owner_name.split()[-1] if len(academy.owner_name.split()) > 1 else "Admin", "role": "admin"}
                },
                headers={"apikey": config("SUPABASE_SERVICE_ROLE_KEY"), "Authorization": f"Bearer {config('SUPABASE_SERVICE_ROLE_KEY')}", "Content-Type": "application/json"}
            )
            if response.status_code != 200:
                error_data = response.json()
                logger.error(f"Supabase admin creation error: {error_data}")
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to create admin user: {error_data.get('msg', 'Unknown error')}")
            supabase_user = response.json()
        user_profile = {
            "user_id": supabase_user["id"], "email": academy.admin_email,
            "first_name": academy.owner_name.split()[0] if academy.owner_name else "Academy",
            "last_name": academy.owner_name.split()[-1] if len(academy.owner_name.split()) > 1 else "Admin",
            "name": academy.owner_name, "role": "admin", "created_at": datetime.now(timezone.utc),
            "is_active": True, "academy_id": academy_id
        }
        users_collection.insert_one(user_profile)
        status = calculate_academy_status(academy.subscription_expiry_date)
        academy_doc = academy.dict()
        academy_doc.update({"academy_id": academy_id, "created_at": datetime.now(timezone.utc)})
        academies_collection.insert_one(academy_doc)
        result = Academy(**academy_doc)
        result.status = status
        return {"academy": result.dict(), "admin_credentials": {"email": academy.admin_email, "password": admin_password, "message": "Admin user created successfully. Please save these credentials!"}}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating academy: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to create academy: {str(e)}")

@app.get("/api/super-admin/academies", response_model=List[Academy])
async def get_all_academies_super_admin(current_user: dict = Depends(require_super_admin())):
    academies = list(academies_collection.find({}))
    result = []
    for academy in academies:
        try:
            academy_obj = Academy(**academy)
            academy_obj.status = calculate_academy_status(academy["subscription_expiry_date"])
            result.append(academy_obj)
        except Exception as e:
            logger.error(f"Failed to parse academy document: {academy.get('academy_id')} with error: {e}")
            continue
    return result

@app.get("/api/super-admin/academies/{academy_id}", response_model=Academy)
async def get_academy_super_admin(academy_id: str, current_user: dict = Depends(require_super_admin())):
    academy = academies_collection.find_one({"academy_id": academy_id})
    if not academy:
        raise HTTPException(status_code=404, detail="Academy not found")
    result = Academy(**academy)
    result.status = calculate_academy_status(academy["subscription_expiry_date"])
    return result

@app.put("/api/super-admin/academies/{academy_id}", response_model=Academy)
async def update_academy_super_admin(academy_id: str, academy_update: AcademyUpdate, current_user: dict = Depends(require_super_admin())):
    academy = academies_collection.find_one({"academy_id": academy_id})
    if not academy:
        raise HTTPException(status_code=404, detail="Academy not found")
    update_doc = academy_update.dict(exclude_unset=True)
    if update_doc:
        academies_collection.update_one({"academy_id": academy_id}, {"$set": update_doc})
    updated_academy = academies_collection.find_one({"academy_id": academy_id})
    result = Academy(**updated_academy)
    result.status = calculate_academy_status(updated_academy["subscription_expiry_date"])
    return result

@app.delete("/api/super-admin/academies/{academy_id}")
async def delete_academy_super_admin(academy_id: str, current_user: dict = Depends(require_super_admin())):
    academy = academies_collection.find_one({"academy_id": academy_id})
    if not academy:
        raise HTTPException(status_code=404, detail="Academy not found")
    academies_collection.delete_one({"academy_id": academy_id})
    coaches_collection.delete_many({"academy_id": academy_id})
    students_collection.delete_many({"academy_id": academy_id})
    sessions_collection.delete_many({"academy_id": academy_id})
    users_collection.delete_many({"academy_id": academy_id, "role": {"$in": ["admin", "coach", "student"]}})
    return {"message": "Academy deleted successfully"}

# ... (the rest of the file is unchanged)

@app.post("/api/create-super-admin")
async def create_super_admin_user():
    existing_super_admin = users_collection.find_one({"role": "super_admin"})
    if existing_super_admin:
        return {"message": "Super admin already exists", "email": existing_super_admin["email"], "name": existing_super_admin.get("name", ""), "user_id": existing_super_admin["user_id"]}
    email = "superadmin@trackmyacademy.com"
    password = "SuperAdmin123!"
    first_name, last_name = "Super", "Administrator"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{config('SUPABASE_URL')}/auth/v1/admin/users",
                json={"email": email, "password": password, "email_confirm": True, "user_metadata": {"first_name": first_name, "last_name": last_name, "role": "super_admin"}},
                headers={"apikey": config("SUPABASE_SERVICE_ROLE_KEY"), "Authorization": f"Bearer {config('SUPABASE_SERVICE_ROLE_KEY')}", "Content-Type": "application/json"}
            )
            if response.status_code != 200:
                error_data = response.json()
                logger.error(f"Supabase super admin creation error: {error_data}")
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to create super admin in Supabase: {error_data.get('msg', 'Unknown error')}")
            supabase_user = response.json()
        user_profile = {"user_id": supabase_user["id"], "email": email, "first_name": first_name, "last_name": last_name, "name": f"{first_name} {last_name}", "role": "super_admin", "created_at": datetime.now(timezone.utc), "is_active": True, "academy_id": None}
        users_collection.insert_one(user_profile)
        logger.info(f"Super admin created successfully: {email}")
        return {"message": "Super admin created successfully", "email": email, "password": password, "name": f"{first_name} {last_name}", "user_id": supabase_user["id"], "instructions": "You can now sign in using the login form."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating super admin: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to create super admin: {str(e)}")


@app.get("/api/health")
async def health_check():
    try:
        client.admin.command('ismaster')
        db_status = "healthy"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = "unhealthy"
    return {"status": "healthy" if db_status == "healthy" else "unhealthy", "timestamp": datetime.now(timezone.utc), "database": db_status, "environment": ENVIRONMENT, "version": "1.0.0"}

@app.on_event("startup")
async def startup_event():
    logger.info(f"Track My Academy API starting up in {ENVIRONMENT} mode")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
