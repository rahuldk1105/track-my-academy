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

# Import Supabase auth
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
    allowed_origins = os.getenv("CORS_ORIGINS", "https://trackmyacademy.vercel.app").split(",")
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

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/token")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# MongoDB connection with error handling
MONGO_URL = os.getenv("MONGO_URL")
if not MONGO_URL:
    raise ValueError("MONGO_URL environment variable is required")

try:
    client = MongoClient(MONGO_URL)
    # Test connection
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
    role: str  # super_admin, admin, coach, student
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

# Enhanced Academy Models
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

# Enhanced Authentication Models
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

def calculate_academy_status(subscription_expiry_date: datetime) -> str:
    """Calculate academy subscription status based on expiry date"""
    now = datetime.now(timezone.utc)
    
    # Convert to timezone-aware datetime if needed
    if subscription_expiry_date.tzinfo is None:
        subscription_expiry_date = subscription_expiry_date.replace(tzinfo=timezone.utc)
    
    if now > subscription_expiry_date:
        return "expired"
    elif (subscription_expiry_date - now).days <= 10:
        return "expiring_soon"
    else:
        return "active"

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Get current user from Supabase JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decode Supabase JWT token
        payload = jwt.decode(
            token, 
            config("SUPABASE_JWT_SECRET"), 
            algorithms=["HS256"],
            options={"verify_aud": False}
        )
        
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        
        if user_id is None or email is None:
            raise credentials_exception
            
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.JWTError:
        raise credentials_exception
    
    # Get user profile from MongoDB
    user = users_collection.find_one({"user_id": user_id})
    if user is None:
        raise credentials_exception
    
    return User(
        user_id=user["user_id"],
        email=user["email"],
        role=user["role"],
        name=user.get("name", ""),
        academy_id=user.get("academy_id"),
        is_active=user.get("is_active", True),
        created_at=user["created_at"]
    )

async def require_super_admin(current_user: User = Depends(get_current_user)):
    """Dependency to ensure only super admins can access certain endpoints"""
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    return current_user

# Enhanced Authentication endpoints with Supabase
@app.post("/api/auth/signup", response_model=AuthResponse)
async def signup(user_data: UserSignUp):
    """Enhanced signup with Supabase"""
    try:
        # Create user in Supabase using admin API
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{config('SUPABASE_URL')}/auth/v1/admin/users",
                json={
                    "email": user_data.email,
                    "password": user_data.password,
                    "email_confirm": True,  # Auto-confirm for development
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
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=error_data.get("msg", "Failed to create user in Supabase")
                )
            
            supabase_user = response.json()
        
        # Create user profile in MongoDB
        user_profile = {
            "user_id": supabase_user["id"],
            "email": user_data.email,
            "first_name": user_data.first_name,
            "last_name": user_data.last_name,
            "name": f"{user_data.first_name} {user_data.last_name}".strip(),
            "role": user_data.role,
            "created_at": datetime.now(timezone.utc),
            "is_active": True,
            "academy_id": None  # Will be set later when user joins an academy
        }
        
        users_collection.insert_one(user_profile)
        logger.info(f"User created successfully: {user_data.email}")
        
        return AuthResponse(
            message="Account created successfully! You can now sign in.",
            success=True,
            user={
                "id": supabase_user["id"],
                "email": user_data.email,
                "first_name": user_data.first_name,
                "last_name": user_data.last_name,
                "role": user_data.role
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating account: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating account: {str(e)}"
        )

@app.post("/api/auth/signin", response_model=AuthResponse)
async def signin(credentials: UserSignIn):
    """Enhanced signin with Supabase"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{config('SUPABASE_URL')}/auth/v1/token?grant_type=password",
                json={
                    "email": credentials.email,
                    "password": credentials.password
                },
                headers={
                    "apikey": config("SUPABASE_ANON_KEY"),
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code != 200:
                error_data = response.json()
                logger.warning(f"Failed login attempt for {credentials.email}: {error_data.get('error_description', 'Invalid credentials')}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=error_data.get("error_description", "Invalid credentials")
                )
            
            auth_data = response.json()
            
            # Get user profile from MongoDB
            user_profile = users_collection.find_one({"user_id": auth_data["user"]["id"]})
            if not user_profile:
                # Create profile if it doesn't exist (fallback)
                user_profile = {
                    "user_id": auth_data["user"]["id"],
                    "email": auth_data["user"]["email"],
                    "first_name": auth_data["user"]["user_metadata"].get("first_name", ""),
                    "last_name": auth_data["user"]["user_metadata"].get("last_name", ""),
                    "name": f"{auth_data['user']['user_metadata'].get('first_name', '')} {auth_data['user']['user_metadata'].get('last_name', '')}".strip() or auth_data["user"]["email"].split("@")[0],
                    "role": auth_data["user"]["user_metadata"].get("role", "student"),
                    "created_at": datetime.now(timezone.utc),
                    "is_active": True,
                    "academy_id": None
                }
                users_collection.insert_one(user_profile)
            
            logger.info(f"User signed in successfully: {credentials.email}")
            
            return AuthResponse(
                message="Successfully signed in!",
                success=True,
                user={
                    "id": auth_data["user"]["id"],
                    "email": auth_data["user"]["email"],
                    "access_token": auth_data["access_token"],
                    "refresh_token": auth_data["refresh_token"],
                    "expires_in": auth_data["expires_in"],
                    "token_type": auth_data["token_type"],
                    "first_name": user_profile.get("first_name", ""),
                    "last_name": user_profile.get("last_name", ""),
                    "name": user_profile.get("name", ""),
                    "role": user_profile.get("role", "student"),
                    "academy_id": user_profile.get("academy_id")
                }
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error signing in: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error signing in: {str(e)}"
        )

@app.get("/api/auth/profile", response_model=AuthResponse) 
async def get_user_profile(current_user: dict = Depends(JWTBearer())):
    """Get user profile from MongoDB"""
    try:
        user_profile = users_collection.find_one({"user_id": current_user["user_id"]})
        
        if not user_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        return AuthResponse(
            message="Profile retrieved successfully",
            success=True,
            user={
                "user_id": user_profile["user_id"],
                "email": user_profile["email"],
                "first_name": user_profile.get("first_name", ""),
                "last_name": user_profile.get("last_name", ""),
                "name": user_profile.get("name", ""),
                "role": user_profile.get("role", "student"),
                "academy_id": user_profile.get("academy_id"),
                "is_active": user_profile.get("is_active", True)
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving profile: {str(e)}"
        )

@app.post("/api/auth/sync-profile", response_model=AuthResponse)
async def sync_user_profile(profile_data: dict, current_user: dict = Depends(JWTBearer())):
    """Sync user profile with MongoDB"""
    try:
        # Update or create user profile in MongoDB
        user_profile = {
            "user_id": current_user["user_id"],
            "email": profile_data.get("email"),
            "first_name": profile_data.get("first_name", ""),
            "last_name": profile_data.get("last_name", ""),
            "name": profile_data.get("name", ""),
            "role": profile_data.get("role", "student"),
            "academy_id": profile_data.get("academy_id"),
            "is_active": True,
            "updated_at": datetime.now(timezone.utc)
        }
        
        # Upsert the profile
        users_collection.update_one(
            {"user_id": current_user["user_id"]},
            {"$set": user_profile, "$setOnInsert": {"created_at": datetime.now(timezone.utc)}},
            upsert=True
        )
        
        return AuthResponse(
            message="Profile synced successfully",
            success=True,
            user=user_profile
        )
        
    except Exception as e:
        logger.error(f"Error syncing profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error syncing profile: {str(e)}"
        )

@app.post("/api/auth/reset-password", response_model=AuthResponse)
async def request_password_reset(reset_request: PasswordResetRequest):
    """Request password reset email"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{config('SUPABASE_URL')}/auth/v1/recover",
                json={
                    "email": reset_request.email,
                    "options": {
                        "redirectTo": f"{config('FRONTEND_URL')}/reset-password"
                    }
                },
                headers={
                    "apikey": config("SUPABASE_ANON_KEY"),
                    "Content-Type": "application/json"
                }
            )
            
            # Always return success for security (don't reveal if email exists)
            return AuthResponse(
                message="If an account with that email exists, we've sent you a password reset link.",
                success=True
            )
            
    except Exception as e:
        return AuthResponse(
            message="If an account with that email exists, we've sent you a password reset link.",
            success=True
        )
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

# File Upload endpoint
@app.post("/api/upload-academy-logo")
async def upload_academy_logo(
    file: UploadFile = File(...),
    current_user: User = Depends(require_super_admin)
):
    """Upload academy logo - only super admins can upload"""
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/jpg", "image/png"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only PNG and JPG files are allowed"
        )
    
    # Generate unique filename
    file_extension = file.filename.split(".")[-1].lower()
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to save file")
    
    # Return URL
    file_url = f"/uploads/{unique_filename}"
    return {"file_url": file_url}

# Super Admin Academy Management Endpoints
@app.post("/api/super-admin/academies")
async def create_academy_super_admin(
    academy: AcademyCreate, 
    current_user: User = Depends(require_super_admin)
):
    """Create academy - Super admin only"""
    academy_id = str(uuid.uuid4())
    
    # Generate admin credentials
    import secrets
    import string
    admin_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
    
    try:
        # Create admin user in Supabase
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{config('SUPABASE_URL')}/auth/v1/admin/users",
                json={
                    "email": academy.admin_email,
                    "password": admin_password,
                    "email_confirm": True,  # Auto-confirm for admin
                    "user_metadata": {
                        "first_name": academy.owner_name.split()[0] if academy.owner_name else "Academy",
                        "last_name": academy.owner_name.split()[-1] if len(academy.owner_name.split()) > 1 else "Admin", 
                        "role": "admin"
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
                logger.error(f"Supabase admin creation error: {error_data}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to create admin user: {error_data.get('msg', 'Unknown error')}"
                )
            
            supabase_user = response.json()
        
        # Create user profile in MongoDB
        user_profile = {
            "user_id": supabase_user["id"],
            "email": academy.admin_email,
            "first_name": academy.owner_name.split()[0] if academy.owner_name else "Academy",
            "last_name": academy.owner_name.split()[-1] if len(academy.owner_name.split()) > 1 else "Admin",
            "name": academy.owner_name,
            "role": "admin",
            "created_at": datetime.now(timezone.utc),
            "is_active": True,
            "academy_id": academy_id
        }
        
        users_collection.insert_one(user_profile)
        
        # Calculate initial status
        status = calculate_academy_status(academy.subscription_expiry_date)
        
        academy_doc = {
            "academy_id": academy_id,
            "academy_name": academy.academy_name,
            "academy_location": academy.academy_location,
            "owner_name": academy.owner_name,
            "admin_contact": academy.admin_contact,
            "admin_email": academy.admin_email,
            "student_limit": academy.student_limit,
            "coach_limit": academy.coach_limit,
            "subscription_start_date": academy.subscription_start_date,
            "subscription_expiry_date": academy.subscription_expiry_date,
            "branches": academy.branches,
            "academy_logo_url": academy.academy_logo_url,
            "created_at": datetime.now(timezone.utc)
        }
        
        academies_collection.insert_one(academy_doc)
        
        # Return academy with admin credentials
        result = Academy(**academy_doc)
        result.status = status
        
        return {
            "academy": result.dict(),
            "admin_credentials": {
                "email": academy.admin_email,
                "password": admin_password,
                "message": "Admin user created successfully. Please save these credentials!"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating academy: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create academy: {str(e)}"
        )

@app.get("/api/super-admin/academies", response_model=List[Academy])
async def get_all_academies_super_admin(current_user: User = Depends(require_super_admin)):
    """Get all academies - Super admin only"""
    academies = list(academies_collection.find({}))
    
    result = []
    for academy in academies:
        academy_obj = Academy(**academy)
        academy_obj.status = calculate_academy_status(academy["subscription_expiry_date"])
        result.append(academy_obj)
    
    return result

@app.get("/api/super-admin/academies/{academy_id}", response_model=Academy)
async def get_academy_super_admin(
    academy_id: str, 
    current_user: User = Depends(require_super_admin)
):
    """Get specific academy - Super admin only"""
    academy = academies_collection.find_one({"academy_id": academy_id})
    if not academy:
        raise HTTPException(status_code=404, detail="Academy not found")
    
    result = Academy(**academy)
    result.status = calculate_academy_status(academy["subscription_expiry_date"])
    return result

@app.put("/api/super-admin/academies/{academy_id}", response_model=Academy)
async def update_academy_super_admin(
    academy_id: str,
    academy_update: AcademyUpdate,
    current_user: User = Depends(require_super_admin)
):
    """Update academy - Super admin only"""
    academy = academies_collection.find_one({"academy_id": academy_id})
    if not academy:
        raise HTTPException(status_code=404, detail="Academy not found")
    
    # Create update document with only provided fields
    update_doc = {}
    for field, value in academy_update.dict(exclude_unset=True).items():
        if value is not None:
            update_doc[field] = value
    
    if update_doc:
        academies_collection.update_one(
            {"academy_id": academy_id},
            {"$set": update_doc}
        )
    
    # Get updated academy
    updated_academy = academies_collection.find_one({"academy_id": academy_id})
    result = Academy(**updated_academy)
    result.status = calculate_academy_status(updated_academy["subscription_expiry_date"])
    return result

@app.delete("/api/super-admin/academies/{academy_id}")
async def delete_academy_super_admin(
    academy_id: str,
    current_user: User = Depends(require_super_admin)
):
    """Delete academy - Super admin only"""
    academy = academies_collection.find_one({"academy_id": academy_id})
    if not academy:
        raise HTTPException(status_code=404, detail="Academy not found")
    
    # Delete academy and related data
    academies_collection.delete_one({"academy_id": academy_id})
    coaches_collection.delete_many({"academy_id": academy_id})
    students_collection.delete_many({"academy_id": academy_id})
    sessions_collection.delete_many({"academy_id": academy_id})
    users_collection.delete_many({"academy_id": academy_id, "role": {"$in": ["admin", "coach", "student"]}})
    
    return {"message": "Academy deleted successfully"}

# Original Academy endpoints (for regular admins)
@app.post("/api/academies", response_model=Academy)
async def create_academy(academy: AcademyCreate):
    academy_id = str(uuid.uuid4())
    
    # Calculate initial status
    status = calculate_academy_status(academy.subscription_expiry_date)
    
    academy_doc = {
        "academy_id": academy_id,
        "academy_name": academy.academy_name,
        "academy_location": academy.academy_location,
        "owner_name": academy.owner_name,
        "admin_contact": academy.admin_contact,
        "admin_email": academy.admin_email,
        "student_limit": academy.student_limit,
        "coach_limit": academy.coach_limit,
        "subscription_start_date": academy.subscription_start_date,
        "subscription_expiry_date": academy.subscription_expiry_date,
        "branches": academy.branches,
        "academy_logo_url": academy.academy_logo_url,
        "created_at": datetime.now(timezone.utc)
    }
    
    academies_collection.insert_one(academy_doc)
    
    result = Academy(**academy_doc)
    result.status = status
    return result

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
    
    result = []
    for academy in academies:
        academy_obj = Academy(**academy)
        academy_obj.status = calculate_academy_status(academy["subscription_expiry_date"])
        result.append(academy_obj)
    
    return result

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
    
    result = Academy(**academy)
    result.status = calculate_academy_status(academy["subscription_expiry_date"])
    return result

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
    """Production-ready health check endpoint"""
    try:
        # Test database connection
        client.admin.command('ismaster')
        db_status = "healthy"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = "unhealthy"
    
    return {
        "status": "healthy" if db_status == "healthy" else "unhealthy",
        "timestamp": datetime.now(timezone.utc),
        "database": db_status,
        "environment": ENVIRONMENT,
        "version": "1.0.0"
    }

# Super Admin User Creation Endpoint (for initial setup)
@app.post("/api/create-super-admin")
async def create_super_admin_user():
    """Create initial super admin user - only works if no super admin exists"""
    
    # Check if any super admin already exists
    existing_super_admin = users_collection.find_one({"role": "super_admin"})
    if existing_super_admin:
        return {
            "message": "Super admin already exists",
            "email": existing_super_admin["email"],
            "name": existing_super_admin.get("name", existing_super_admin.get("first_name", "")),
            "user_id": existing_super_admin["user_id"]
        }
    
    # Create super admin user in Supabase first
    email = "superadmin@trackmyacademy.com"
    password = "SuperAdmin123!"
    first_name = "Super"
    last_name = "Administrator"
    
    try:
        # Create user in Supabase using admin API
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{config('SUPABASE_URL')}/auth/v1/admin/users",
                json={
                    "email": email,
                    "password": password,
                    "email_confirm": True,  # Auto-confirm
                    "user_metadata": {
                        "first_name": first_name,
                        "last_name": last_name,
                        "role": "super_admin"
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
                logger.error(f"Supabase super admin creation error: {error_data}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to create super admin in Supabase: {error_data.get('msg', 'Unknown error')}"
                )
            
            supabase_user = response.json()
        
        # Create user profile in MongoDB
        user_profile = {
            "user_id": supabase_user["id"],
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
            "name": f"{first_name} {last_name}",
            "role": "super_admin",
            "created_at": datetime.now(timezone.utc),
            "is_active": True,
            "academy_id": None  # Super admin doesn't belong to any specific academy
        }
        
        users_collection.insert_one(user_profile)
        logger.info(f"Super admin created successfully: {email}")
        
        return {
            "message": "Super admin created successfully",
            "email": email,
            "password": password,
            "name": f"{first_name} {last_name}",
            "user_id": supabase_user["id"],
            "instructions": "You can now sign in using the enhanced login form at /login"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating super admin: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create super admin: {str(e)}"
        )

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
    if current_user.role == "coach":
        # Get coach record to compare coach_id
        coach = coaches_collection.find_one({"email": current_user.email})
        if not coach or existing_session["coach_id"] != coach["coach_id"]:
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

# Production-ready startup event
@app.on_event("startup")
async def startup_event():
    logger.info(f"Track My Academy API starting up in {ENVIRONMENT} mode")
    logger.info(f"Database connection: {'✓' if client else '✗'}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)