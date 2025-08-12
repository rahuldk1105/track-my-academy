from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timedelta
from supabase import create_client, Client
import shutil
import aiofiles
# Removed Stripe imports for manual billing


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create uploads directory
UPLOAD_DIR = ROOT_DIR / "uploads" / "logos"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

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

# Stripe configuration - REMOVED for manual billing
# stripe_api_key = os.environ.get('STRIPE_API_KEY')
# if not stripe_api_key:
#     raise ValueError("Missing STRIPE_API_KEY environment variable")
stripe_api_key = None  # Disabled for manual billing

# Security
security = HTTPBearer(auto_error=False)

# Create the main app without a prefix
app = FastAPI()

# Mount static files for uploaded logos
app.mount("/uploads", StaticFiles(directory=str(ROOT_DIR / "uploads")), name="uploads")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Subscription Plans Configuration (Backend-defined for security) - INR Pricing
SUBSCRIPTION_PLANS = {
    "starter_monthly": {
        "name": "Starter Monthly",
        "price": 2499.00,  # ₹2,499 per month
        "billing_cycle": "monthly",
        "currency": "inr",
        "player_limit": 50,
        "coach_limit": 5,
        "features": ["Basic player management", "Coach assignment", "Performance tracking", "Email support"]
    },
    "starter_annual": {
        "name": "Starter Annual",
        "price": 24990.00,  # ₹24,990 per year (2 months free)
        "billing_cycle": "annual",
        "currency": "inr",
        "player_limit": 50,
        "coach_limit": 5,
        "features": ["Basic player management", "Coach assignment", "Performance tracking", "Email support"]
    },
    "pro_monthly": {
        "name": "Pro Monthly", 
        "price": 4999.00,  # ₹4,999 per month
        "billing_cycle": "monthly",
        "currency": "inr",
        "player_limit": 200,
        "coach_limit": 20,
        "features": ["Advanced analytics", "Custom reports", "API access", "Priority support", "Mobile app access"]
    },
    "pro_annual": {
        "name": "Pro Annual",
        "price": 49990.00,  # ₹49,990 per year (2 months free)
        "billing_cycle": "annual",
        "currency": "inr", 
        "player_limit": 200,
        "coach_limit": 20,
        "features": ["Advanced analytics", "Custom reports", "API access", "Priority support", "Mobile app access"]
    },
    "enterprise_monthly": {
        "name": "Enterprise Monthly",
        "price": 12499.00,  # ₹12,499 per month
        "billing_cycle": "monthly",
        "currency": "inr",
        "player_limit": 1000,
        "coach_limit": 100,
        "features": ["Unlimited everything", "Custom integrations", "Dedicated support", "Training sessions", "White labeling"]
    },
    "enterprise_annual": {
        "name": "Enterprise Annual", 
        "price": 124990.00,  # ₹1,24,990 per year (2 months free)
        "billing_cycle": "annual",
        "currency": "inr",
        "player_limit": 1000,
        "coach_limit": 100,
        "features": ["Unlimited everything", "Custom integrations", "Dedicated support", "Training sessions", "White labeling"]
    }
}


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

# Academy Models
class Academy(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    owner_name: str
    email: str
    phone: Optional[str] = None
    location: Optional[str] = None
    sports_type: Optional[str] = None
    logo_url: Optional[str] = None
    player_limit: int = 50  # Default limit for player accounts
    coach_limit: int = 10   # Default limit for coach accounts
    status: str = "pending"  # pending, approved, rejected, suspended
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    supabase_user_id: Optional[str] = None

class AcademyCreate(BaseModel):
    name: str
    owner_name: str
    email: str
    phone: Optional[str] = None
    location: Optional[str] = None
    sports_type: Optional[str] = None
    player_limit: Optional[int] = 50
    coach_limit: Optional[int] = 10

class AcademyUpdate(BaseModel):
    name: Optional[str] = None
    owner_name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    sports_type: Optional[str] = None
    player_limit: Optional[int] = None
    coach_limit: Optional[int] = None
    status: Optional[str] = None

# Demo Request Models
class DemoRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    full_name: str
    email: str
    phone: Optional[str] = None
    academy_name: str
    location: str
    sports_type: str
    current_students: Optional[str] = None
    message: Optional[str] = None
    status: str = "pending"  # pending, contacted, closed
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class DemoRequestCreate(BaseModel):
    full_name: str
    email: str
    phone: Optional[str] = None
    academy_name: str
    location: str
    sports_type: str
    current_students: Optional[str] = None
    message: Optional[str] = None

class DemoRequestUpdate(BaseModel):
    status: str  # pending, contacted, closed

# Subscription and Billing Models
class SubscriptionPlan(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # e.g., "Basic", "Pro", "Enterprise", "Custom"
    price_monthly: Optional[float] = None  # USD monthly price
    price_annual: Optional[float] = None   # USD annual price (with discount)
    features: List[str] = []               # List of features included
    player_limit: int = 50                 # Maximum players allowed
    coach_limit: int = 10                  # Maximum coaches allowed
    is_custom: bool = False                # True for custom pricing plans
    is_active: bool = True                 # Plan availability
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class AcademySubscription(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    academy_id: str
    plan_id: str
    billing_cycle: str = "monthly"  # monthly, annual
    amount: float                   # Custom amount for this academy
    currency: str = "inr"           # Changed to INR for Indian market
    status: str = "active"          # active, cancelled, suspended, pending, trial
    current_period_start: datetime
    current_period_end: datetime
    auto_renew: bool = True
    notes: Optional[str] = None     # Admin notes about subscription
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class PaymentTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    academy_id: str
    subscription_id: Optional[str] = None
    amount: float
    currency: str = "inr"           # Changed to INR
    payment_method: str             # GPay, Cash, Bank Transfer, UPI, etc.
    payment_status: str = "pending" # pending, paid, failed, cancelled
    payment_date: Optional[datetime] = None  # Actual payment date
    billing_cycle: Optional[str] = None
    description: Optional[str] = None
    admin_notes: Optional[str] = None # Admin notes about the payment
    receipt_url: Optional[str] = None # URL to receipt/proof if uploaded
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SubscriptionCreateRequest(BaseModel):
    academy_id: str
    billing_cycle: str  # monthly, annual
    custom_amount: Optional[float] = None  # For custom pricing

# Manual Billing Models
class ManualPaymentCreate(BaseModel):
    academy_id: str
    amount: float
    payment_method: str  # GPay, Cash, Bank Transfer, UPI, etc.
    payment_date: datetime
    billing_cycle: Optional[str] = None
    description: Optional[str] = None
    admin_notes: Optional[str] = None
    receipt_url: Optional[str] = None

class ManualPaymentUpdate(BaseModel):
    amount: Optional[float] = None
    payment_method: Optional[str] = None
    payment_date: Optional[datetime] = None
    payment_status: Optional[str] = None  # pending, paid, failed, cancelled
    billing_cycle: Optional[str] = None
    description: Optional[str] = None
    admin_notes: Optional[str] = None
    receipt_url: Optional[str] = None

class SubscriptionManualCreate(BaseModel):
    academy_id: str
    plan_id: str  # Reference to SUBSCRIPTION_PLANS key
    billing_cycle: str  # monthly, annual
    custom_amount: Optional[float] = None  # Override plan price if needed
    current_period_start: datetime
    current_period_end: datetime
    status: str = "active"  # active, cancelled, suspended, pending, trial
    auto_renew: bool = True
    notes: Optional[str] = None

class SubscriptionManualUpdate(BaseModel):
    plan_id: Optional[str] = None
    billing_cycle: Optional[str] = None
    amount: Optional[float] = None
    status: Optional[str] = None
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    auto_renew: Optional[bool] = None
    notes: Optional[str] = None

class PaymentSessionRequest(BaseModel):
    academy_id: str
    billing_cycle: str  # monthly, annual
    origin_url: str     # Frontend origin for success/cancel URLs

# Player and Coach Management Models
class Player(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    academy_id: str  # Links player to academy
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None  # Store as string for simplicity
    age: Optional[int] = None
    position: Optional[str] = None  # Forward, Midfielder, Defender, etc.
    jersey_number: Optional[int] = None
    height: Optional[str] = None  # e.g., "5'10"
    weight: Optional[str] = None  # e.g., "70 kg"
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    medical_notes: Optional[str] = None
    status: str = "active"  # active, inactive, suspended
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class PlayerCreate(BaseModel):
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    age: Optional[int] = None
    position: Optional[str] = None
    jersey_number: Optional[int] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    medical_notes: Optional[str] = None

class PlayerUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    age: Optional[int] = None
    position: Optional[str] = None
    jersey_number: Optional[int] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    medical_notes: Optional[str] = None
    status: Optional[str] = None

class Coach(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    academy_id: str  # Links coach to academy
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    specialization: Optional[str] = None  # Fitness, Technical, Goalkeeping, etc.
    experience_years: Optional[int] = None
    qualifications: Optional[str] = None  # Certifications, degrees, etc.
    salary: Optional[float] = None
    hire_date: Optional[str] = None
    contract_end_date: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    bio: Optional[str] = None
    status: str = "active"  # active, inactive, suspended
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CoachCreate(BaseModel):
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    specialization: Optional[str] = None
    experience_years: Optional[int] = None
    qualifications: Optional[str] = None
    salary: Optional[float] = None
    hire_date: Optional[str] = None
    contract_end_date: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    bio: Optional[str] = None

class CoachUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    specialization: Optional[str] = None
    experience_years: Optional[int] = None
    qualifications: Optional[str] = None
    salary: Optional[float] = None
    hire_date: Optional[str] = None
    contract_end_date: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    bio: Optional[str] = None
    status: Optional[str] = None

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

async def get_academy_user_info(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get authenticated user info with academy details"""
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        # Verify JWT token with Supabase
        user_response = supabase.auth.get_user(credentials.credentials)
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = user_response.user
        
        # Look up academy information for this user
        academy = await db.academies.find_one({"supabase_user_id": user.id})
        
        if not academy:
            # Check if this is a super admin
            if user.email == "admin@trackmyacademy.com":
                return {
                    "user": user,
                    "role": "super_admin",
                    "academy_id": None,
                    "academy_name": None
                }
            else:
                raise HTTPException(status_code=403, detail="No academy associated with this user")
        
        return {
            "user": user,
            "role": "academy_user",
            "academy_id": academy["id"],
            "academy_name": academy["name"],
            "academy": academy
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

async def require_academy_user(user_info = Depends(get_academy_user_info)):
    """Ensure user is an academy user (not super admin)"""
    if user_info["role"] != "academy_user":
        raise HTTPException(status_code=403, detail="Academy user access required")
    return user_info

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

# File Upload Endpoints
@api_router.post("/upload/logo")
async def upload_academy_logo(file: UploadFile = File(...)):
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Generate unique filename
        file_extension = file.filename.split(".")[-1]
        unique_filename = f"{str(uuid.uuid4())}.{file_extension}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Return the URL path
        logo_url = f"/uploads/logos/{unique_filename}"
        return {"logo_url": logo_url, "message": "Logo uploaded successfully"}
        
    except HTTPException:
        # Re-raise HTTP exceptions (like validation errors)
        raise
    except Exception as e:
        logger.error(f"File upload error: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload logo")

# Authentication Endpoints

# DISABLED: Public signup endpoint - SaaS model requires admin-controlled user creation
# @api_router.post("/auth/signup", response_model=AuthResponse)
# async def signup(request: SignUpRequest):
#     # This endpoint is disabled for SaaS model
#     # Only admin can create academy accounts through admin dashboard
#     raise HTTPException(status_code=403, detail="Public signup disabled. Contact administrator for academy registration.")

# Admin-Only Academy Creation Endpoint (Enhanced with new fields)
@api_router.post("/admin/create-academy", response_model=AuthResponse)
async def admin_create_academy(
    email: str = Form(...),
    password: str = Form(...),
    name: str = Form(...),
    owner_name: str = Form(...),
    phone: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    sports_type: Optional[str] = Form(None),
    player_limit: int = Form(50),
    coach_limit: int = Form(10),
    logo: Optional[UploadFile] = File(None),
    current_user = Depends(get_current_user)
):
    try:
        # TODO: Add admin role verification here
        # if not current_user or current_user.get('role') != 'admin':
        #     raise HTTPException(status_code=403, detail="Admin access required")
        
        # Handle logo upload if provided
        logo_url = None
        if logo:
            if not logo.content_type.startswith("image/"):
                raise HTTPException(status_code=400, detail="Logo must be an image file")
            
            # Generate unique filename
            file_extension = logo.filename.split(".")[-1] if logo.filename else "png"
            unique_filename = f"{str(uuid.uuid4())}.{file_extension}"
            file_path = UPLOAD_DIR / unique_filename
            
            # Save file
            async with aiofiles.open(file_path, 'wb') as f:
                content = await logo.read()
                await f.write(content)
            
            logo_url = f"/uploads/logos/{unique_filename}"
        
        # Prepare user metadata
        user_metadata = {
            'academy_name': name,
            'owner_name': owner_name,
            'phone': phone,
            'location': location,
            'sports_type': sports_type,
            'player_limit': player_limit,
            'coach_limit': coach_limit
        }
        
        # Create academy account using admin privileges
        response = supabase_admin.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,  # Skip email confirmation for admin-created accounts
            "user_metadata": user_metadata
        })
        
        if response.user:
            # Store academy data in MongoDB
            academy_data = Academy(
                name=name,
                owner_name=owner_name,
                email=email,
                phone=phone,
                location=location,
                sports_type=sports_type,
                logo_url=logo_url,
                player_limit=player_limit,
                coach_limit=coach_limit,
                status="approved",  # Admin-created academies are auto-approved
                supabase_user_id=response.user.id
            )
            
            await db.academies.insert_one(academy_data.dict())
            
            return AuthResponse(
                user=response.user.model_dump() if hasattr(response.user, 'model_dump') else dict(response.user),
                session={},  # No session for admin-created users
                message="Academy account created successfully by admin"
            )
        else:
            raise HTTPException(status_code=400, detail="Failed to create academy account")
            
    except Exception as e:
        logger.error(f"Admin academy creation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# Academy Management Endpoints
@api_router.get("/admin/academies", response_model=List[Academy])
async def get_academies(current_user = Depends(get_current_user)):
    try:
        # TODO: Add admin role verification
        # if not current_user or current_user.get('role') != 'admin':
        #     raise HTTPException(status_code=403, detail="Admin access required")
        
        academies = await db.academies.find().to_list(1000)
        return [Academy(**academy) for academy in academies]
    except Exception as e:
        logger.error(f"Error fetching academies: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch academies")

@api_router.put("/admin/academies/{academy_id}", response_model=Academy)
async def update_academy(academy_id: str, academy_update: AcademyUpdate, current_user = Depends(get_current_user)):
    try:
        # TODO: Add admin role verification
        # if not current_user or current_user.get('role') != 'admin':
        #     raise HTTPException(status_code=403, detail="Admin access required")
        
        # Find the academy
        academy = await db.academies.find_one({"id": academy_id})
        if not academy:
            raise HTTPException(status_code=404, detail="Academy not found")
        
        # Update fields
        update_data = academy_update.dict(exclude_unset=True)
        if update_data:
            update_data["updated_at"] = datetime.utcnow()
            await db.academies.update_one(
                {"id": academy_id},
                {"$set": update_data}
            )
        
        # Return updated academy
        updated_academy = await db.academies.find_one({"id": academy_id})
        return Academy(**updated_academy)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating academy: {e}")
        raise HTTPException(status_code=500, detail="Failed to update academy")

@api_router.delete("/admin/academies/{academy_id}")
async def delete_academy(academy_id: str, current_user = Depends(get_current_user)):
    try:
        # TODO: Add admin role verification
        # if not current_user or current_user.get('role') != 'admin':
        #     raise HTTPException(status_code=403, detail="Admin access required")
        
        # Find the academy
        academy = await db.academies.find_one({"id": academy_id})
        if not academy:
            raise HTTPException(status_code=404, detail="Academy not found")
        
        # Delete from MongoDB
        await db.academies.delete_one({"id": academy_id})
        
        # TODO: Also delete the Supabase user if needed
        # if academy.get('supabase_user_id'):
        #     try:
        #         supabase_admin.auth.admin.delete_user(academy['supabase_user_id'])
        #     except Exception as e:
        #         logger.warning(f"Failed to delete Supabase user: {e}")
        
        return {"message": "Academy deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting academy: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete academy")

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
        
        # Determine user role and academy information
        user_email = user_dict.get('email', '')
        user_id = user_dict.get('id', '')
        
        # Check if user is super admin
        is_super_admin = user_email == 'admin@trackmyacademy.com'
        
        # Initialize role info
        role_info = {
            'role': 'super_admin' if is_super_admin else 'academy_user',
            'academy_id': None,
            'academy_name': None,
            'permissions': []
        }
        
        if is_super_admin:
            role_info['permissions'] = ['manage_all_academies', 'view_all_data', 'create_academies', 'manage_billing']
        else:
            # Find academy for this user
            academy = await db.academies.find_one({"supabase_user_id": user_id})
            if academy:
                role_info['academy_id'] = academy['id']
                role_info['academy_name'] = academy['name']
                role_info['permissions'] = ['manage_own_academy', 'create_coaches', 'view_own_data']
        
        # Add role info to user data
        user_dict['role_info'] = role_info
        
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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# System Overview Models
class SystemStats(BaseModel):
    total_academies: int
    active_academies: int
    pending_academies: int
    total_demo_requests: int
    pending_demo_requests: int
    recent_activity_count: int

class RecentActivity(BaseModel):
    id: str
    type: str  # academy_created, demo_request, academy_approved, etc.
    description: str
    timestamp: datetime
    status: str  # success, pending, info

class RecentAcademy(BaseModel):
    id: str
    name: str
    owner_name: str
    location: str
    sports_type: str
    status: str
    created_at: datetime

class SystemOverview(BaseModel):
    stats: SystemStats
    recent_activities: List[RecentActivity]
    recent_academies: List[RecentAcademy]
    server_status: str

# System Overview Endpoint
@api_router.get("/admin/system-overview", response_model=SystemOverview)
async def get_system_overview(current_user = Depends(get_current_user)):
    try:
        # TODO: Add admin role verification
        # if not current_user or current_user.get('role') != 'admin':
        #     raise HTTPException(status_code=403, detail="Admin access required")
        
        # Get academy stats
        academies = await db.academies.find().to_list(1000)
        total_academies = len(academies)
        active_academies = len([a for a in academies if a.get('status') == 'approved'])
        pending_academies = len([a for a in academies if a.get('status') == 'pending'])
        
        # Get demo request stats
        demo_requests = await db.demo_requests.find().to_list(1000)
        total_demo_requests = len(demo_requests)
        pending_demo_requests = len([d for d in demo_requests if d.get('status') == 'pending'])
        
        # Create stats
        stats = SystemStats(
            total_academies=total_academies,
            active_academies=active_academies,
            pending_academies=pending_academies,
            total_demo_requests=total_demo_requests,
            pending_demo_requests=pending_demo_requests,
            recent_activity_count=len(academies) + len(demo_requests)
        )
        
        # Get recent activities (last 10)
        recent_activities = []
        
        # Recent academy activities
        recent_academy_activities = await db.academies.find().sort("created_at", -1).limit(5).to_list(5)
        for academy in recent_academy_activities:
            activity = RecentActivity(
                id=str(uuid.uuid4()),
                type="academy_created",
                description=f"New academy registration: {academy.get('name', 'Unknown')}",
                timestamp=academy.get('created_at', datetime.utcnow()),
                status="success" if academy.get('status') == 'approved' else "pending"
            )
            recent_activities.append(activity)
        
        # Recent demo request activities
        recent_demo_activities = await db.demo_requests.find().sort("created_at", -1).limit(5).to_list(5)
        for demo in recent_demo_activities:
            activity = RecentActivity(
                id=str(uuid.uuid4()),
                type="demo_request",
                description=f"Demo request from: {demo.get('academy_name', 'Unknown Academy')}",
                timestamp=demo.get('created_at', datetime.utcnow()),
                status=demo.get('status', 'pending')
            )
            recent_activities.append(activity)
        
        # Sort by timestamp (newest first) and limit to 10
        recent_activities.sort(key=lambda x: x.timestamp, reverse=True)
        recent_activities = recent_activities[:10]
        
        # Get recently added academies (last 5)
        recent_academies_data = await db.academies.find().sort("created_at", -1).limit(5).to_list(5)
        recent_academies = []
        for academy in recent_academies_data:
            academy_obj = RecentAcademy(
                id=academy.get('id', str(uuid.uuid4())),
                name=academy.get('name', 'Unknown'),
                owner_name=academy.get('owner_name', 'Unknown'),
                location=academy.get('location', 'Unknown'),
                sports_type=academy.get('sports_type', 'Unknown'),
                status=academy.get('status', 'pending'),
                created_at=academy.get('created_at', datetime.utcnow())
            )
            recent_academies.append(academy_obj)
        
        # Server status (always healthy for now)
        server_status = "healthy"
        
        overview = SystemOverview(
            stats=stats,
            recent_activities=recent_activities,
            recent_academies=recent_academies,
            server_status=server_status
        )
        
        return overview
        
    except Exception as e:
        logger.error(f"Error fetching system overview: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch system overview")

# Demo Request Endpoints

# Public endpoint for demo requests (no authentication required)
@api_router.post("/demo-requests", response_model=DemoRequest)
async def create_demo_request(request: DemoRequestCreate):
    try:
        demo_request_data = DemoRequest(**request.dict())
        await db.demo_requests.insert_one(demo_request_data.dict())
        
        logger.info(f"Demo request created: {demo_request_data.full_name} - {demo_request_data.academy_name}")
        return demo_request_data
    except Exception as e:
        logger.error(f"Error creating demo request: {e}")
        raise HTTPException(status_code=500, detail="Failed to create demo request")

# Admin endpoints for managing demo requests
@api_router.get("/admin/demo-requests", response_model=List[DemoRequest])
async def get_demo_requests(current_user = Depends(get_current_user)):
    try:
        # TODO: Add admin role verification
        # if not current_user or current_user.get('role') != 'admin':
        #     raise HTTPException(status_code=403, detail="Admin access required")
        
        demo_requests = await db.demo_requests.find().sort("created_at", -1).to_list(1000)
        return [DemoRequest(**request) for request in demo_requests]
    except Exception as e:
        logger.error(f"Error fetching demo requests: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch demo requests")

@api_router.put("/admin/demo-requests/{request_id}", response_model=DemoRequest)
async def update_demo_request(request_id: str, request_update: DemoRequestUpdate, current_user = Depends(get_current_user)):
    try:
        # TODO: Add admin role verification
        # if not current_user or current_user.get('role') != 'admin':
        #     raise HTTPException(status_code=403, detail="Admin access required")
        
        # Find the request
        demo_request = await db.demo_requests.find_one({"id": request_id})
        if not demo_request:
            raise HTTPException(status_code=404, detail="Demo request not found")
        
        # Update fields
        update_data = request_update.dict(exclude_unset=True)
        if update_data:
            update_data["updated_at"] = datetime.utcnow()
            await db.demo_requests.update_one(
                {"id": request_id},
                {"$set": update_data}
            )
        
        # Return updated request
        updated_request = await db.demo_requests.find_one({"id": request_id})
        return DemoRequest(**updated_request)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating demo request: {e}")
        raise HTTPException(status_code=500, detail="Failed to update demo request")

# ========== BILLING AND SUBSCRIPTION ENDPOINTS ==========

# Get Available Subscription Plans
@api_router.get("/billing/plans")
async def get_subscription_plans():
    """Get all available subscription plans with pricing"""
    try:
        return {"plans": SUBSCRIPTION_PLANS}
    except Exception as e:
        logger.error(f"Error fetching subscription plans: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch subscription plans")

# Get Academy Subscription Status
@api_router.get("/billing/academy/{academy_id}/subscription")
async def get_academy_subscription(academy_id: str, current_user = Depends(get_current_user)):
    """Get current subscription status for an academy"""
    try:
        # TODO: Add proper authorization (admin or academy owner)
        
        subscription = await db.academy_subscriptions.find_one({"academy_id": academy_id})
        if not subscription:
            return {"subscription": None, "status": "no_subscription"}
        
        return {"subscription": AcademySubscription(**subscription)}
    except Exception as e:
        logger.error(f"Error fetching academy subscription: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch subscription")

# DISABLED: Stripe payment session creation - removed for manual billing
# @api_router.post("/billing/create-payment-session")
# async def create_payment_session(request: PaymentSessionRequest, http_request: Request, current_user = Depends(get_current_user)):
#     """Create Stripe payment session for academy subscription"""
#     try:
#         # Check if Stripe is enabled
#         if not stripe_api_key:
#             raise HTTPException(status_code=503, detail="Payment processing is currently disabled. Please contact support for manual billing.")
#         
#         # Validate academy exists
#         academy = await db.academies.find_one({"id": request.academy_id})
#         if not academy:
#             raise HTTPException(status_code=404, detail="Academy not found")
#         
#         # Get plan pricing - support custom amounts
#         plan_key = f"starter_{request.billing_cycle}"  # Default plan
#         if plan_key not in SUBSCRIPTION_PLANS:
#             raise HTTPException(status_code=400, detail="Invalid billing cycle")
#         
#         # For now, use default pricing - in future, support custom amounts per academy
#         amount = SUBSCRIPTION_PLANS[plan_key]["price"]
#         
#         # Initialize Stripe
#         host_url = str(http_request.base_url).rstrip('/')
#         webhook_url = f"{host_url}/api/webhook/stripe"
#         stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
#         
#         # Build dynamic URLs from frontend origin
#         success_url = f"{request.origin_url}/billing/success?session_id={{CHECKOUT_SESSION_ID}}"
#         cancel_url = f"{request.origin_url}/billing/cancel"
#         
#         # Create checkout session
#         checkout_request = CheckoutSessionRequest(
#             amount=amount,
#             currency="usd",
#             success_url=success_url,
#             cancel_url=cancel_url,
#             metadata={
#                 "academy_id": request.academy_id,
#                 "billing_cycle": request.billing_cycle,
#                 "source": "academy_subscription",
#                 "plan": plan_key
#             }
#         )
#         
#         session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
#         
#         # Create payment transaction record
#         payment_transaction = PaymentTransaction(
#             academy_id=request.academy_id,
#             session_id=session.session_id,
#             amount=amount,
#             currency="usd",
#             payment_status="pending",
#             stripe_status="pending",
#             billing_cycle=request.billing_cycle,
#             description=f"Subscription - {SUBSCRIPTION_PLANS[plan_key]['name']}",
#             metadata=checkout_request.metadata
#         )
#         
#         await db.payment_transactions.insert_one(payment_transaction.dict())
#         
#         logger.info(f"Payment session created for academy {request.academy_id}: {session.session_id}")
#         return {"checkout_url": session.url, "session_id": session.session_id}
#         
#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.error(f"Error creating payment session: {e}")
#         raise HTTPException(status_code=500, detail="Failed to create payment session")

# DISABLED: Stripe payment status check - removed for manual billing
# @api_router.get("/billing/payment-status/{session_id}")
# async def check_payment_status(session_id: str, http_request: Request):
#     """Check the status of a payment session and update subscription if paid"""
#     try:
#         # Check if Stripe is enabled
#         if not stripe_api_key:
#             raise HTTPException(status_code=503, detail="Payment processing is currently disabled. Please contact support for manual billing.")
#         
#         # Initialize Stripe
#         host_url = str(http_request.base_url).rstrip('/')
#         webhook_url = f"{host_url}/api/webhook/stripe"
#         stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
#         
#         # Get payment status from Stripe
#         checkout_status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
#         
#         # Find payment transaction
#         payment_transaction = await db.payment_transactions.find_one({"session_id": session_id})
#         if not payment_transaction:
#             raise HTTPException(status_code=404, detail="Payment transaction not found")
#         
#         # Update payment transaction status
#         update_data = {
#             "payment_status": checkout_status.payment_status,
#             "stripe_status": checkout_status.status,
#             "updated_at": datetime.utcnow()
#         }
#         
#         await db.payment_transactions.update_one(
#             {"session_id": session_id},
#             {"$set": update_data}
#         )
#         
#         # If payment is successful and not already processed
#         if checkout_status.payment_status == "paid" and payment_transaction.get("payment_status") != "paid":
#             await process_successful_payment(payment_transaction, checkout_status)
#         
#         return {
#             "payment_status": checkout_status.payment_status,
#             "status": checkout_status.status,
#             "amount_total": checkout_status.amount_total,
#             "currency": checkout_status.currency
#         }
#         
#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.error(f"Error checking payment status: {e}")
#         raise HTTPException(status_code=500, detail="Failed to check payment status")

# DISABLED: Stripe payment processing function - removed for manual billing
# async def process_successful_payment(payment_transaction: dict, checkout_status: CheckoutStatusResponse):
#     """Process successful payment and create/update subscription"""
#     try:
#         academy_id = payment_transaction["academy_id"]
#         billing_cycle = payment_transaction["billing_cycle"]
#         
#         # Calculate subscription period
#         start_date = datetime.utcnow()
#         if billing_cycle == "monthly":
#             end_date = start_date + timedelta(days=30)
#         elif billing_cycle == "annual":
#             end_date = start_date + timedelta(days=365)
#         else:
#             raise ValueError(f"Invalid billing cycle: {billing_cycle}")
#         
#         # Check if academy already has a subscription
#         existing_subscription = await db.academy_subscriptions.find_one({"academy_id": academy_id})
#         
#         if existing_subscription:
#             # Update existing subscription
#             update_data = {
#                 "billing_cycle": billing_cycle,
#                 "amount": payment_transaction["amount"],
#                 "status": "active",
#                 "current_period_start": start_date,
#                 "current_period_end": end_date,
#                 "updated_at": start_date
#             }
#             
#             await db.academy_subscriptions.update_one(
#                 {"academy_id": academy_id},
#                 {"$set": update_data}
#             )
#             
#             logger.info(f"Updated subscription for academy {academy_id}")
#         else:
#             # Create new subscription
#             subscription = AcademySubscription(
#                 academy_id=academy_id,
#                 plan_id="starter",  # Default plan for now
#                 billing_cycle=billing_cycle,
#                 amount=payment_transaction["amount"],
#                 current_period_start=start_date,
#                 current_period_end=end_date,
#                 status="active"
#             )
#             
#             await db.academy_subscriptions.insert_one(subscription.dict())
#             logger.info(f"Created new subscription for academy {academy_id}")
#         
#     except Exception as e:
#         logger.error(f"Error processing successful payment: {e}")
#         raise

# DISABLED: Stripe webhook handler - removed for manual billing
# @api_router.post("/webhook/stripe")
# async def stripe_webhook(request: Request):
#     """Handle Stripe webhooks for payment events"""
#     try:
#         # Check if Stripe is enabled
#         if not stripe_api_key:
#             raise HTTPException(status_code=503, detail="Payment processing is currently disabled.")
#         
#         # Get request body as bytes
#         body = await request.body()
#         stripe_signature = request.headers.get("stripe-signature", "")
#         
#         # Initialize Stripe
#         host_url = str(request.base_url).rstrip('/')
#         webhook_url = f"{host_url}/api/webhook/stripe"
#         stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
#         
#         # Handle webhook
#         webhook_response = await stripe_checkout.handle_webhook(body, stripe_signature)
#         
#         # Process webhook event based on type
#         if webhook_response.event_type in ["checkout.session.completed", "payment_intent.succeeded"]:
#             # Find and update payment transaction
#             payment_transaction = await db.payment_transactions.find_one({"session_id": webhook_response.session_id})
#             if payment_transaction and payment_transaction.get("payment_status") != "paid":
#                 
#                 # Update payment status
#                 await db.payment_transactions.update_one(
#                     {"session_id": webhook_response.session_id},
#                     {"$set": {
#                         "payment_status": "paid",
#                         "stripe_status": "completed",
#                         "updated_at": datetime.utcnow()
#                     }}
#                 )
#                 
#                 # Process successful payment
#                 checkout_status = CheckoutStatusResponse(
#                     status="complete",
#                     payment_status="paid",
#                     amount_total=int(payment_transaction["amount"] * 100),  # Convert to cents
#                     currency=payment_transaction["currency"],
#                     metadata=webhook_response.metadata or {}
#                 )
#                 
#                 await process_successful_payment(payment_transaction, checkout_status)
#                 logger.info(f"Webhook processed: payment completed for session {webhook_response.session_id}")
#         
#         return {"status": "success"}
#         
#     except Exception as e:
#         logger.error(f"Error processing webhook: {e}")
#         raise HTTPException(status_code=500, detail="Webhook processing failed")

# Admin: Get All Subscriptions
@api_router.get("/admin/billing/subscriptions", response_model=List[AcademySubscription])
async def get_all_subscriptions(current_user = Depends(get_current_user)):
    """Admin endpoint to get all academy subscriptions"""
    try:
        # TODO: Add admin role verification
        
        subscriptions = await db.academy_subscriptions.find().to_list(1000)
        return [AcademySubscription(**sub) for sub in subscriptions]
    except Exception as e:
        logger.error(f"Error fetching subscriptions: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch subscriptions")

# Admin: Get All Payment Transactions
@api_router.get("/admin/billing/transactions", response_model=List[PaymentTransaction])
async def get_payment_transactions(current_user = Depends(get_current_user)):
    """Admin endpoint to get all payment transactions"""
    try:
        # TODO: Add admin role verification
        
        transactions = await db.payment_transactions.find().sort("created_at", -1).to_list(1000)
        return [PaymentTransaction(**txn) for txn in transactions]
    except Exception as e:
        logger.error(f"Error fetching payment transactions: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch payment transactions")

# Admin: Update Academy Subscription
@api_router.put("/admin/billing/academy/{academy_id}/subscription")
async def update_academy_subscription(
    academy_id: str, 
    subscription_data: dict,
    current_user = Depends(get_current_user)
):
    """Admin endpoint to manually update academy subscription"""
    try:
        # TODO: Add admin role verification
        
        # Check if academy exists
        academy = await db.academies.find_one({"id": academy_id})
        if not academy:
            raise HTTPException(status_code=404, detail="Academy not found")
        
        # Update subscription
        subscription_data["updated_at"] = datetime.utcnow()
        
        result = await db.academy_subscriptions.update_one(
            {"academy_id": academy_id},
            {"$set": subscription_data},
            upsert=True
        )
        
        # Get updated subscription
        updated_subscription = await db.academy_subscriptions.find_one({"academy_id": academy_id})
        
        return {"message": "Subscription updated successfully", "subscription": updated_subscription}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating academy subscription: {e}")
        raise HTTPException(status_code=500, detail="Failed to update subscription")

# ========== MANUAL BILLING ENDPOINTS ==========

# Admin: Create Manual Payment Record
@api_router.post("/admin/billing/payments/manual", response_model=PaymentTransaction)
async def create_manual_payment(payment_data: ManualPaymentCreate, current_user = Depends(get_current_user)):
    """Admin endpoint to create manual payment records"""
    try:
        # TODO: Add admin role verification
        
        # Verify academy exists
        academy = await db.academies.find_one({"id": payment_data.academy_id})
        if not academy:
            raise HTTPException(status_code=404, detail="Academy not found")
        
        # Create payment transaction
        payment_transaction = PaymentTransaction(
            academy_id=payment_data.academy_id,
            amount=payment_data.amount,
            currency="inr",
            payment_method=payment_data.payment_method,
            payment_date=payment_data.payment_date,
            payment_status="paid",  # Manual payments are typically already paid
            billing_cycle=payment_data.billing_cycle,
            description=payment_data.description,
            admin_notes=payment_data.admin_notes,
            receipt_url=payment_data.receipt_url
        )
        
        # Save to database
        await db.payment_transactions.insert_one(payment_transaction.dict())
        
        return payment_transaction
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating manual payment: {e}")
        raise HTTPException(status_code=500, detail="Failed to create manual payment")

# Admin: Update Manual Payment Record
@api_router.put("/admin/billing/payments/{payment_id}", response_model=PaymentTransaction)
async def update_manual_payment(
    payment_id: str, 
    payment_data: ManualPaymentUpdate,
    current_user = Depends(get_current_user)
):
    """Admin endpoint to update manual payment records"""
    try:
        # TODO: Add admin role verification
        
        # Check if payment exists
        existing_payment = await db.payment_transactions.find_one({"id": payment_id})
        if not existing_payment:
            raise HTTPException(status_code=404, detail="Payment transaction not found")
        
        # Prepare update data (only include non-None fields)
        update_data = {k: v for k, v in payment_data.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        # Update payment transaction
        await db.payment_transactions.update_one(
            {"id": payment_id},
            {"$set": update_data}
        )
        
        # Get updated payment
        updated_payment = await db.payment_transactions.find_one({"id": payment_id})
        
        return PaymentTransaction(**updated_payment)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating manual payment: {e}")
        raise HTTPException(status_code=500, detail="Failed to update manual payment")

# Admin: Get Payment History for Academy
@api_router.get("/admin/billing/academy/{academy_id}/payments", response_model=List[PaymentTransaction])
async def get_academy_payment_history(academy_id: str, current_user = Depends(get_current_user)):
    """Admin endpoint to get payment history for specific academy"""
    try:
        # TODO: Add admin role verification
        
        # Verify academy exists
        academy = await db.academies.find_one({"id": academy_id})
        if not academy:
            raise HTTPException(status_code=404, detail="Academy not found")
        
        # Get payment history
        payments = await db.payment_transactions.find(
            {"academy_id": academy_id}
        ).sort("created_at", -1).to_list(1000)
        
        return [PaymentTransaction(**payment) for payment in payments]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching academy payment history: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch payment history")

# Admin: Create Manual Subscription
@api_router.post("/admin/billing/subscriptions/manual", response_model=AcademySubscription)
async def create_manual_subscription(subscription_data: SubscriptionManualCreate, current_user = Depends(get_current_user)):
    """Admin endpoint to create manual subscriptions"""
    try:
        # TODO: Add admin role verification
        
        # Verify academy exists
        academy = await db.academies.find_one({"id": subscription_data.academy_id})
        if not academy:
            raise HTTPException(status_code=404, detail="Academy not found")
        
        # Verify plan exists
        if subscription_data.plan_id not in SUBSCRIPTION_PLANS:
            raise HTTPException(status_code=404, detail="Subscription plan not found")
        
        # Get plan details
        plan = SUBSCRIPTION_PLANS[subscription_data.plan_id]
        
        # Determine amount (use custom amount or plan price)
        amount = subscription_data.custom_amount if subscription_data.custom_amount else plan["price"]
        
        # Create subscription
        subscription = AcademySubscription(
            academy_id=subscription_data.academy_id,
            plan_id=subscription_data.plan_id,
            billing_cycle=subscription_data.billing_cycle,
            amount=amount,
            currency="inr",
            status=subscription_data.status,
            current_period_start=subscription_data.current_period_start,
            current_period_end=subscription_data.current_period_end,
            auto_renew=subscription_data.auto_renew,
            notes=subscription_data.notes
        )
        
        # Save to database (upsert to replace existing subscription)
        await db.academy_subscriptions.update_one(
            {"academy_id": subscription_data.academy_id},
            {"$set": subscription.dict()},
            upsert=True
        )
        
        return subscription
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating manual subscription: {e}")
        raise HTTPException(status_code=500, detail="Failed to create manual subscription")

# Admin: Update Manual Subscription
@api_router.put("/admin/billing/subscriptions/{subscription_id}", response_model=AcademySubscription)
async def update_manual_subscription(
    subscription_id: str,
    subscription_data: SubscriptionManualUpdate,
    current_user = Depends(get_current_user)
):
    """Admin endpoint to update manual subscriptions"""
    try:
        # TODO: Add admin role verification
        
        # Check if subscription exists
        existing_subscription = await db.academy_subscriptions.find_one({"id": subscription_id})
        if not existing_subscription:
            raise HTTPException(status_code=404, detail="Subscription not found")
        
        # Prepare update data (only include non-None fields)
        update_data = {k: v for k, v in subscription_data.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        # If plan_id is being updated, validate it exists and update amount if no custom amount
        if "plan_id" in update_data and update_data["plan_id"] not in SUBSCRIPTION_PLANS:
            raise HTTPException(status_code=404, detail="Subscription plan not found")
        
        # Update subscription
        await db.academy_subscriptions.update_one(
            {"id": subscription_id},
            {"$set": update_data}
        )
        
        # Get updated subscription
        updated_subscription = await db.academy_subscriptions.find_one({"id": subscription_id})
        
        return AcademySubscription(**updated_subscription)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating manual subscription: {e}")
        raise HTTPException(status_code=500, detail="Failed to update manual subscription")

# Admin: Delete Payment Transaction
@api_router.delete("/admin/billing/payments/{payment_id}")
async def delete_payment_transaction(payment_id: str, current_user = Depends(get_current_user)):
    """Admin endpoint to delete payment transactions"""
    try:
        # TODO: Add admin role verification
        
        # Check if payment exists
        existing_payment = await db.payment_transactions.find_one({"id": payment_id})
        if not existing_payment:
            raise HTTPException(status_code=404, detail="Payment transaction not found")
        
        # Delete payment transaction
        await db.payment_transactions.delete_one({"id": payment_id})
        
        return {"message": "Payment transaction deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting payment transaction: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete payment transaction")

# ========== PLAYER MANAGEMENT ENDPOINTS ==========

# Get all players for an academy (Academy User)
@api_router.get("/academy/players", response_model=List[Player])
async def get_academy_players(user_info = Depends(require_academy_user)):
    """Get all players for the authenticated academy"""
    try:
        academy_id = user_info["academy_id"]
        
        # Get players for this academy
        players_cursor = db.players.find({"academy_id": academy_id})
        players = await players_cursor.to_list(length=None)
        
        return [Player(**player) for player in players]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching academy players: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch players")

# Create a new player (Academy User)
@api_router.post("/academy/players", response_model=Player)
async def create_player(player_data: PlayerCreate, user_info = Depends(require_academy_user)):
    """Create a new player for the authenticated academy"""
    try:
        academy_id = user_info["academy_id"]
        academy = user_info["academy"]
        
        # Check if academy has reached player limit
        current_players = await db.players.count_documents({"academy_id": academy_id, "status": "active"})
        if current_players >= academy.get("player_limit", 50):
            raise HTTPException(
                status_code=400, 
                detail=f"Academy has reached maximum player limit of {academy.get('player_limit', 50)}"
            )
        
        # Check for duplicate jersey number within academy (if provided)
        if player_data.jersey_number is not None:
            existing_jersey = await db.players.find_one({
                "academy_id": academy_id,
                "jersey_number": player_data.jersey_number,
                "status": "active"
            })
            if existing_jersey:
                raise HTTPException(
                    status_code=400,
                    detail=f"Jersey number {player_data.jersey_number} is already taken"
                )
        
        # Create new player
        player = Player(
            academy_id=academy_id,
            **player_data.dict()
        )
        
        # Save to database
        await db.players.insert_one(player.dict())
        
        return player
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating player: {e}")
        raise HTTPException(status_code=500, detail="Failed to create player")

# Get specific player (Academy User)
@api_router.get("/academy/players/{player_id}", response_model=Player)
async def get_player(player_id: str, user_info = Depends(require_academy_user)):
    """Get specific player for the authenticated academy"""
    try:
        academy_id = user_info["academy_id"]
        
        # Find player
        player = await db.players.find_one({"id": player_id, "academy_id": academy_id})
        if not player:
            raise HTTPException(status_code=404, detail="Player not found")
        
        return Player(**player)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching player: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch player")

# Update player (Academy User)
@api_router.put("/academy/players/{player_id}", response_model=Player)
async def update_player(player_id: str, player_data: PlayerUpdate, user_info = Depends(require_academy_user)):
    """Update specific player for the authenticated academy"""
    try:
        academy_id = user_info["academy_id"]
        
        # Check if player exists
        existing_player = await db.players.find_one({"id": player_id, "academy_id": academy_id})
        if not existing_player:
            raise HTTPException(status_code=404, detail="Player not found")
        
        # Check for duplicate jersey number (if updating jersey number)
        if player_data.jersey_number is not None:
            existing_jersey = await db.players.find_one({
                "academy_id": academy_id,
                "jersey_number": player_data.jersey_number,
                "status": "active",
                "id": {"$ne": player_id}  # Exclude current player
            })
            if existing_jersey:
                raise HTTPException(
                    status_code=400,
                    detail=f"Jersey number {player_data.jersey_number} is already taken"
                )
        
        # Update player data
        update_data = {k: v for k, v in player_data.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        await db.players.update_one(
            {"id": player_id, "academy_id": academy_id},
            {"$set": update_data}
        )
        
        # Get updated player
        updated_player = await db.players.find_one({"id": player_id, "academy_id": academy_id})
        return Player(**updated_player)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating player: {e}")
        raise HTTPException(status_code=500, detail="Failed to update player")

# Delete player (Academy User)
@api_router.delete("/academy/players/{player_id}")
async def delete_player(player_id: str, user_info = Depends(require_academy_user)):
    """Delete specific player for the authenticated academy"""
    try:
        academy_id = user_info["academy_id"]
        
        # Check if player exists
        existing_player = await db.players.find_one({"id": player_id, "academy_id": academy_id})
        if not existing_player:
            raise HTTPException(status_code=404, detail="Player not found")
        
        # Delete player
        await db.players.delete_one({"id": player_id, "academy_id": academy_id})
        
        return {"message": "Player deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting player: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete player")

# ========== COACH MANAGEMENT ENDPOINTS ==========

# Get all coaches for an academy (Academy User)
@api_router.get("/academy/coaches", response_model=List[Coach])
async def get_academy_coaches(user_info = Depends(require_academy_user)):
    """Get all coaches for the authenticated academy"""
    try:
        academy_id = user_info["academy_id"]
        
        # Get coaches for this academy
        coaches_cursor = db.coaches.find({"academy_id": academy_id})
        coaches = await coaches_cursor.to_list(length=None)
        
        return [Coach(**coach) for coach in coaches]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching academy coaches: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch coaches")

# Create a new coach (Academy User)
@api_router.post("/academy/coaches", response_model=Coach)
async def create_coach(coach_data: CoachCreate, user_info = Depends(require_academy_user)):
    """Create a new coach for the authenticated academy"""
    try:
        academy_id = user_info["academy_id"]
        academy = user_info["academy"]
        
        # Check if academy has reached coach limit
        current_coaches = await db.coaches.count_documents({"academy_id": academy_id, "status": "active"})
        if current_coaches >= academy.get("coach_limit", 10):
            raise HTTPException(
                status_code=400,
                detail=f"Academy has reached maximum coach limit of {academy.get('coach_limit', 10)}"
            )
        
        # Create new coach
        coach = Coach(
            academy_id=academy_id,
            **coach_data.dict()
        )
        
        # Save to database
        await db.coaches.insert_one(coach.dict())
        
        return coach
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating coach: {e}")
        raise HTTPException(status_code=500, detail="Failed to create coach")

# Get specific coach (Academy User)
@api_router.get("/academy/coaches/{coach_id}", response_model=Coach)
async def get_coach(coach_id: str, user_info = Depends(require_academy_user)):
    """Get specific coach for the authenticated academy"""
    try:
        academy_id = user_info["academy_id"]
        
        # Find coach
        coach = await db.coaches.find_one({"id": coach_id, "academy_id": academy_id})
        if not coach:
            raise HTTPException(status_code=404, detail="Coach not found")
        
        return Coach(**coach)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching coach: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch coach")

# Update coach (Academy User)
@api_router.put("/academy/coaches/{coach_id}", response_model=Coach)
async def update_coach(coach_id: str, coach_data: CoachUpdate, user_info = Depends(require_academy_user)):
    """Update specific coach for the authenticated academy"""
    try:
        academy_id = user_info["academy_id"]
        
        # Check if coach exists
        existing_coach = await db.coaches.find_one({"id": coach_id, "academy_id": academy_id})
        if not existing_coach:
            raise HTTPException(status_code=404, detail="Coach not found")
        
        # Update coach data
        update_data = {k: v for k, v in coach_data.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        await db.coaches.update_one(
            {"id": coach_id, "academy_id": academy_id},
            {"$set": update_data}
        )
        
        # Get updated coach
        updated_coach = await db.coaches.find_one({"id": coach_id, "academy_id": academy_id})
        return Coach(**updated_coach)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating coach: {e}")
        raise HTTPException(status_code=500, detail="Failed to update coach")

# Delete coach (Academy User)
@api_router.delete("/academy/coaches/{coach_id}")
async def delete_coach(coach_id: str, user_info = Depends(require_academy_user)):
    """Delete specific coach for the authenticated academy"""
    try:
        academy_id = user_info["academy_id"]
        
        # Check if coach exists
        existing_coach = await db.coaches.find_one({"id": coach_id, "academy_id": academy_id})
        if not existing_coach:
            raise HTTPException(status_code=404, detail="Coach not found")
        
        # Delete coach
        await db.coaches.delete_one({"id": coach_id, "academy_id": academy_id})
        
        return {"message": "Coach deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting coach: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete coach")

# ========== ACADEMY STATS ENDPOINT ==========

# Get academy stats (Academy User)
@api_router.get("/academy/stats")
async def get_academy_stats(user_info = Depends(require_academy_user)):
    """Get academy statistics"""
    try:
        academy_id = user_info["academy_id"]
        
        # Count players and coaches
        total_players = await db.players.count_documents({"academy_id": academy_id})
        active_players = await db.players.count_documents({"academy_id": academy_id, "status": "active"})
        total_coaches = await db.coaches.count_documents({"academy_id": academy_id})
        active_coaches = await db.coaches.count_documents({"academy_id": academy_id, "status": "active"})
        
        return {
            "total_players": total_players,
            "active_players": active_players,
            "total_coaches": total_coaches,
            "active_coaches": active_coaches,
            "player_limit": user_info["academy"].get("player_limit", 50),
            "coach_limit": user_info["academy"].get("coach_limit", 10)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching academy stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch academy stats")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
