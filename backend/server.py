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
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest


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

# Security
security = HTTPBearer(auto_error=False)

# Create the main app without a prefix
app = FastAPI()

# Mount static files for uploaded logos
app.mount("/uploads", StaticFiles(directory=str(ROOT_DIR / "uploads")), name="uploads")

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
    currency: str = "usd"
    status: str = "active"          # active, cancelled, suspended, pending
    current_period_start: datetime
    current_period_end: datetime
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    auto_renew: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class PaymentTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    academy_id: Optional[str] = None
    subscription_id: Optional[str] = None
    session_id: str                 # Stripe session ID
    amount: float
    currency: str = "usd"
    payment_status: str = "pending" # pending, paid, failed, expired
    stripe_status: str = "pending"  # Stripe checkout session status
    billing_cycle: Optional[str] = None
    description: Optional[str] = None
    metadata: Optional[Dict[str, str]] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SubscriptionCreateRequest(BaseModel):
    academy_id: str
    billing_cycle: str  # monthly, annual
    custom_amount: Optional[float] = None  # For custom pricing

class PaymentSessionRequest(BaseModel):
    academy_id: str
    billing_cycle: str  # monthly, annual
    origin_url: str     # Frontend origin for success/cancel URLs

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
