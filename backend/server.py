from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
from supabase import create_client, Client


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Supabase connection
supabase_url = os.environ.get('SUPABASE_URL')
supabase_key = os.environ.get('SUPABASE_KEY')
supabase_service_key = os.environ.get('SUPABASE_SERVICE_KEY')

if not all([supabase_url, supabase_key, supabase_service_key]):
    raise ValueError("Missing required Supabase environment variables")

# Initialize Supabase clients
supabase: Client = create_client(supabase_url, supabase_key)
supabase_admin: Client = create_client(supabase_url, supabase_service_key)

# Security
security = HTTPBearer(auto_error=False)

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Authentication Models
class SignUpRequest(BaseModel):
    email: str
    password: str
    academy_name: Optional[str] = None
    owner_name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    sports_type: Optional[str] = None

class SignInRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    user: dict
    session: dict
    message: str

class UserResponse(BaseModel):
    user: Optional[dict] = None
    message: str

class SupabaseHealthResponse(BaseModel):
    status: str
    supabase_url: str
    connection: str

# Authentication helper functions
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if credentials is None:
        return None
    
    try:
        # Verify JWT token with Supabase
        user = supabase.auth.get_user(credentials.credentials)
        return user.user if user.user else None
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        return None

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

# Supabase Health Check
@api_router.get("/supabase/health", response_model=SupabaseHealthResponse)
async def supabase_health_check():
    try:
        # Test connection by getting user (will return None for anon key)
        test_response = supabase.auth.get_user()
        return SupabaseHealthResponse(
            status="healthy",
            supabase_url=supabase_url,
            connection="active"
        )
    except Exception as e:
        logger.error(f"Supabase health check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Supabase connection failed: {str(e)}")

# Authentication Endpoints
@api_router.post("/auth/signup", response_model=AuthResponse)
async def signup(request: SignUpRequest):
    try:
        # Prepare user metadata
        user_metadata = {}
        if request.academy_name:
            user_metadata['academy_name'] = request.academy_name
        if request.owner_name:
            user_metadata['owner_name'] = request.owner_name
        if request.phone:
            user_metadata['phone'] = request.phone
        if request.location:
            user_metadata['location'] = request.location
        if request.sports_type:
            user_metadata['sports_type'] = request.sports_type
        
        # Sign up with Supabase
        response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password,
            "options": {
                "data": user_metadata
            }
        })
        
        if response.user:
            return AuthResponse(
                user=response.user.model_dump() if hasattr(response.user, 'model_dump') else dict(response.user),
                session=response.session.model_dump() if response.session and hasattr(response.session, 'model_dump') else dict(response.session) if response.session else {},
                message="User created successfully"
            )
        else:
            raise HTTPException(status_code=400, detail="Failed to create user")
            
    except Exception as e:
        logger.error(f"Signup error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/auth/login", response_model=AuthResponse)
async def login(request: SignInRequest):
    try:
        response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        
        if response.user:
            return AuthResponse(
                user=response.user.model_dump() if hasattr(response.user, 'model_dump') else dict(response.user),
                session=response.session.model_dump() if response.session and hasattr(response.session, 'model_dump') else dict(response.session) if response.session else {},
                message="Login successful"
            )
        else:
            raise HTTPException(status_code=401, detail="Invalid credentials")
            
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

@api_router.post("/auth/logout")
async def logout(current_user = Depends(get_current_user)):
    try:
        supabase.auth.sign_out()
        return {"message": "Logout successful"}
    except Exception as e:
        logger.error(f"Logout error: {e}")
        raise HTTPException(status_code=500, detail="Logout failed")

@api_router.get("/auth/user", response_model=UserResponse)
async def get_user(current_user = Depends(get_current_user)):
    if current_user:
        # Convert user object to dictionary
        user_dict = current_user.model_dump() if hasattr(current_user, 'model_dump') else dict(current_user)
        return UserResponse(
            user=user_dict,
            message="User retrieved successfully"
        )
    else:
        return UserResponse(
            user=None,
            message="No authenticated user"
        )

@api_router.post("/auth/refresh", response_model=AuthResponse)
async def refresh_token():
    try:
        response = supabase.auth.refresh_session()
        if response.session:
            return AuthResponse(
                user=response.user.model_dump() if response.user and hasattr(response.user, 'model_dump') else dict(response.user) if response.user else {},
                session=response.session.model_dump() if hasattr(response.session, 'model_dump') else dict(response.session),
                message="Token refreshed successfully"
            )
        else:
            raise HTTPException(status_code=401, detail="Failed to refresh token")
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        raise HTTPException(status_code=401, detail="Failed to refresh token")

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
