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
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
from supabase import create_client, Client
import shutil
import aiofiles

# ---- Add your class AFTER imports ----
class RefreshRequest(BaseModel):
    refresh_token: str

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

app = FastAPI()
@app.get("/")
async def root():
    return {"status": "ok"}

# Create uploads directory
UPLOAD_DIR = ROOT_DIR / "uploads" / "logos"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(
    mongo_url,
    maxPoolSize=int(os.getenv("MONGO_MAX_POOL", "10")),
    minPoolSize=0,
    serverSelectionTimeoutMS=5000,
    connectTimeoutMS=5000,
    retryWrites=True,
    tls=False,  # Local MongoDB
)
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

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Mount static files for uploaded logos on main app but with /api prefix
app.mount("/api/uploads", StaticFiles(directory=str(ROOT_DIR / "uploads")), name="uploads")

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
    role: Optional[str] = None    # <-- add this line
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

# Sport-based Position Mapping
SPORT_POSITIONS = {
    "Football": ["Goalkeeper", "Center Back", "Left Back", "Right Back", "Defensive Midfielder", "Central Midfielder", "Attacking Midfielder", "Left Winger", "Right Winger", "Striker", "Center Forward"],
    "Cricket": ["Wicket Keeper", "Batsman", "All Rounder", "Fast Bowler", "Spin Bowler", "Opening Batsman", "Middle Order", "Finisher"],
    "Basketball": ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"],
    "Tennis": ["Singles Player", "Doubles Player"],
    "Badminton": ["Singles Player", "Doubles Player"],
    "Hockey": ["Goalkeeper", "Defender", "Midfielder", "Forward"],
    "Volleyball": ["Setter", "Outside Hitter", "Middle Blocker", "Opposite Hitter", "Libero", "Defensive Specialist"],
    "Swimming": ["Freestyle", "Backstroke", "Breaststroke", "Butterfly", "Individual Medley"],
    "Athletics": ["Sprinter", "Middle Distance", "Long Distance", "Jumper", "Thrower"],
    "Other": ["Player"]
}

# Sport-specific Performance Categories (5 categories per sport)
SPORT_PERFORMANCE_CATEGORIES = {
    "Football": [
        "Technical Skills",
        "Physical Fitness", 
        "Tactical Awareness",
        "Mental Strength",
        "Teamwork"
    ],
    "Cricket": [
        "Technical Skills",
        "Physical Fitness",
        "Mental Strength", 
        "Teamwork",
        "Match Awareness"
    ],
    "Basketball": [
        "Shooting & Scoring",
        "Defense & Rebounding",
        "Ball Handling",
        "Court Vision",
        "Physical Fitness"
    ],
    "Tennis": [
        "Technical Skills",
        "Physical Fitness",
        "Mental Strength",
        "Match Strategy",
        "Consistency"
    ],
    "Swimming": [
        "Technique",
        "Speed & Endurance",
        "Mental Focus",
        "Training Discipline",
        "Race Strategy"
    ],
    "Badminton": [
        "Technical Skills",
        "Physical Fitness",
        "Mental Focus",
        "Court Coverage",
        "Game Strategy"
    ],
    "Athletics": [
        "Technical Form",
        "Physical Fitness",
        "Mental Strength",
        "Training Discipline",
        "Competition Performance"
    ],
    "Hockey": [
        "Technical Skills",
        "Physical Fitness",
        "Tactical Awareness",
        "Mental Strength",
        "Teamwork"
    ],
    "Volleyball": [
        "Technical Skills",
        "Physical Fitness",
        "Tactical Awareness",
        "Mental Strength",
        "Teamwork"
    ],
    "Other": [
        "Technical Skills",
        "Physical Fitness",
        "Mental Strength",
        "Performance Consistency",
        "Training Attitude"
    ]
}

# Individual vs Team Sports Classification
INDIVIDUAL_SPORTS = ["Tennis", "Swimming", "Badminton", "Athletics"]
TEAM_SPORTS = ["Football", "Cricket", "Basketball", "Hockey", "Volleyball"]

# Training Days and Batches
TRAINING_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
TRAINING_BATCHES = ["Morning", "Evening", "Both"]

# Helper Functions
def calculate_age_from_dob(date_of_birth: str) -> Optional[int]:
    """Calculate age from date of birth string (YYYY-MM-DD format)"""
    try:
        from datetime import date
        birth_date = datetime.strptime(date_of_birth, "%Y-%m-%d").date()
        today = date.today()
        age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
        return age
    except (ValueError, TypeError):
        return None

def is_individual_sport(sport: str) -> bool:
    """Check if a sport is individual or team-based"""
    return sport in INDIVIDUAL_SPORTS

def get_sport_performance_categories(sport: str) -> List[str]:
    """Get performance categories for a specific sport"""
    return SPORT_PERFORMANCE_CATEGORIES.get(sport, SPORT_PERFORMANCE_CATEGORIES["Other"])

def generate_default_password() -> str:
    """Generate a default password for new players"""
    import random
    import string
    # Generate an 8-character password with letters and numbers
    characters = string.ascii_letters + string.digits
    return ''.join(random.choice(characters) for _ in range(8))

async def create_player_supabase_account(email: str, password: str, player_data: dict) -> Optional[str]:
    """Create a Supabase account for a player"""
    try:
        # Create player account using admin privileges
        user_metadata = {
            'player_name': f"{player_data.get('first_name', '')} {player_data.get('last_name', '')}",
            'academy_id': player_data.get('academy_id'),
            'role': 'player'
        }
        
        response = supabase_admin.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,  # Skip email confirmation for admin-created accounts
            "user_metadata": user_metadata
        })
        
        if response.user:
            return response.user.id
        return None
    except Exception as e:
        logger.error(f"Failed to create Supabase account for player: {e}")
        return None

# Enhanced Player and Coach Management Models
class Player(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    academy_id: str  # Links player to academy
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None  # Store as string for simplicity
    age: Optional[int] = None  # Auto-calculated from date_of_birth
    gender: Optional[str] = None     
    sport: Optional[str] = None  
    position: Optional[str] = None  # Position based on sport (not needed for individual sports)
    registration_number: str = None  
    height: Optional[str] = None  # e.g., "5'10"
    weight: Optional[str] = None  # e.g., "70 kg"
    photo_url: Optional[str] = None  # Player photo URL
    training_days: List[str] = []  # Days when player trains
    training_batch: Optional[str] = None  # Morning, Evening, Both
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    medical_notes: Optional[str] = None
    status: str = "active"  # active, inactive, suspended
    # Player Authentication Fields
    has_login: bool = False  # Whether player has login credentials
    default_password: Optional[str] = None  # Auto-generated default password
    password_changed: bool = False  # Whether player has changed default password
    supabase_user_id: Optional[str] = None  # Links to Supabase auth user
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class PlayerCreate(BaseModel):
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    age: Optional[int] = None  # Will be auto-calculated if date_of_birth provided
    gender: str  # Required: Male, Female, Other
    sport: str  # Required: Sport type
    position: Optional[str] = None  # Optional for individual sports
    registration_number: str = None 
    height: Optional[str] = None
    weight: Optional[str] = None
    photo_url: Optional[str] = None
    training_days: List[str] = []
    training_batch: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    medical_notes: Optional[str] = None

class PlayerUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    age: Optional[int] = None  # Will be auto-calculated if date_of_birth provided
    gender: Optional[str] = None
    sport: Optional[str] = None
    position: Optional[str] = None
    registration_number: str = None  
    height: Optional[str] = None
    weight: Optional[str] = None
    photo_url: Optional[str] = None
    training_days: Optional[List[str]] = None
    training_batch: Optional[str] = None
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

# Enhanced Attendance and Performance Tracking Models
class PlayerAttendance(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    player_id: str
    academy_id: str
    date: str  # YYYY-MM-DD format
    present: bool
    sport: str  # Sport type for performance categories
    # Sport-specific performance ratings (1-10 scale for each category)
    performance_ratings: Dict[str, Optional[int]] = {}  # e.g., {"Technical Skills": 8, "Physical Fitness": 7, ...}
    notes: Optional[str] = None
    marked_by: str  # User ID who marked attendance
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PlayerAttendanceCreate(BaseModel):
    player_id: str
    date: str
    present: bool
    sport: str  # Required for performance categories
    performance_ratings: Dict[str, Optional[int]] = {}  # Sport-specific ratings
    notes: Optional[str] = None

class PlayerAttendanceUpdate(BaseModel):
    present: Optional[bool] = None
    performance_ratings: Optional[Dict[str, Optional[int]]] = None
    notes: Optional[str] = None

class PlayerPerformanceAnalytics(BaseModel):
    player_id: str
    player_name: str
    sport: str
    total_sessions: int
    attended_sessions: int
    attendance_percentage: float
    # Enhanced analytics with sport-specific categories
    category_averages: Dict[str, float] = {}  # Average rating per performance category
    overall_average_rating: Optional[float] = None
    performance_trend: List[Dict[str, Any]] = []  # Last 30 days trend with categories
    monthly_stats: Dict[str, Dict[str, Any]] = {}  # Monthly breakdown with categories
    category_trends: Dict[str, List[Dict[str, Any]]] = {}  # Individual category trends

class AttendanceMarkingRequest(BaseModel):
    date: str
    attendance_records: List[PlayerAttendanceCreate]

# Sport Positions API Response Model (Legacy - for backward compatibility)
class SportPositionsResponse(BaseModel):
    sports: Dict[str, List[str]]
    training_days: List[str]
    training_batches: List[str]

# Enhanced Sport Configuration API Response Model
class SportConfigResponse(BaseModel):
    sports: Dict[str, List[str]]  # sport -> positions
    performance_categories: Dict[str, List[str]]  # sport -> categories
    individual_sports: List[str]
    team_sports: List[str]
    training_days: List[str]
    training_batches: List[str]

# Theme Preference Models
class ThemePreference(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    theme: str = "light"  # light, dark
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Announcement Models
class Announcement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    academy_id: str
    title: str
    content: str
    priority: str = "medium"  # low, medium, high, urgent
    target_audience: str = "all"  # all, players, coaches, specific_player
    target_player_id: Optional[str] = None  # For player-specific announcements
    is_active: bool = True
    created_by: str  # User ID who created the announcement
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    priority: str = "medium"
    target_audience: str = "all"
    target_player_id: Optional[str] = None

class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    priority: Optional[str] = None
    target_audience: Optional[str] = None
    target_player_id: Optional[str] = None
    is_active: Optional[bool] = None

# Player Authentication Models
class PlayerSignInRequest(BaseModel):
    email: str
    password: str

class PlayerAuthResponse(BaseModel):
    player: dict
    session: dict
    message: str

class PlayerPasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

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

async def get_player_user_info(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get authenticated player user info"""
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        # Verify JWT token with Supabase
        user_response = supabase.auth.get_user(credentials.credentials)
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = user_response.user
        
        # Look up player information for this user
        player = await db.players.find_one({"supabase_user_id": user.id})
        
        if not player:
            raise HTTPException(status_code=403, detail="No player profile associated with this user")
        
        return {
            "user": user,
            "role": "player",
            "player_id": player["id"],
            "academy_id": player["academy_id"],
            "player": player
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Player authentication error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

async def require_player_user(user_info = Depends(get_player_user_info)):
    """Ensure user is a player"""
    if user_info["role"] != "player":
        raise HTTPException(status_code=403, detail="Player access required")
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
        
        # Return the URL path with /api prefix
        logo_url = f"/api/uploads/logos/{unique_filename}"
        return {"logo_url": logo_url, "message": "Logo uploaded successfully"}
        
    except HTTPException:
        # Re-raise HTTP exceptions (like validation errors)
        raise
    except Exception as e:
        logger.error(f"File upload error: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload logo")

@api_router.post("/upload/player-photo")
async def upload_player_photo(file: UploadFile = File(...), user_info = Depends(require_academy_user)):
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Generate unique filename with academy prefix
        academy_id = user_info["academy_id"]
        file_extension = file.filename.split(".")[-1]
        unique_filename = f"player_{academy_id}_{str(uuid.uuid4())}.{file_extension}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Return the URL path with /api prefix
        photo_url = f"/api/uploads/logos/{unique_filename}"
        return {"photo_url": photo_url, "message": "Player photo uploaded successfully"}
        
    except HTTPException:
        # Re-raise HTTP exceptions (like validation errors)
        raise
    except Exception as e:
        logger.error(f"File upload error: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload player photo")

# Sport and Position Configuration Endpoints
@api_router.get("/sports/positions", response_model=SportPositionsResponse)
async def get_sport_positions():
    """Get available sports, positions, training days, and batches (Legacy endpoint)"""
    return SportPositionsResponse(
        sports=SPORT_POSITIONS,
        training_days=TRAINING_DAYS,
        training_batches=TRAINING_BATCHES
    )

@api_router.get("/sports/config", response_model=SportConfigResponse)
async def get_sport_config():
    """Get enhanced sports configuration including performance categories and sport types"""
    return SportConfigResponse(
        sports=SPORT_POSITIONS,
        performance_categories=SPORT_PERFORMANCE_CATEGORIES,
        individual_sports=INDIVIDUAL_SPORTS,
        team_sports=TEAM_SPORTS,
        training_days=TRAINING_DAYS,
        training_batches=TRAINING_BATCHES
    )

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
            
            logo_url = f"/api/uploads/logos/{unique_filename}"
        
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

        # Extract role directly for top-level field
        role = role_info.get("role")

        return UserResponse(
            user=user_dict,
            role=role,
            message="User retrieved successfully"
        )
    else:
        return UserResponse(
            user=None,
            message="No authenticated user"
        )

@api_router.post("/auth/refresh", response_model=AuthResponse)
async def refresh_token(input: RefreshRequest):
    try:
        refreshed = supabase.auth.refresh_session(input.refresh_token)
        if refreshed.session:
            return {
                "user": dict(refreshed.user) if hasattr(refreshed.user, "__iter__") else refreshed.user,
                "session": {
                    "access_token": refreshed.session.access_token,
                    "refresh_token": refreshed.session.refresh_token,
                    "expires_at": refreshed.session.expires_at,
                },
                "message": "Token refreshed successfully",
            }
        raise HTTPException(status_code=401, detail="Failed to refresh token")
    except Exception as e:
        logger.error(f"Refresh error: {e}")
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
        
        # Check for duplicate registration number within academy (if provided)
        if player_data.registration_number:
            existing_registration = await db.players.find_one({
                "academy_id": academy_id,
                "registration_number": player_data.registration_number,
                "status": "active"
            })
            if existing_registration:
                raise HTTPException(
                    status_code=400,
                    detail=f"Registration number {player_data.registration_number} is already taken"
                )
        
        # Prepare player data with enhancements
        player_dict = player_data.dict()
        
        # Auto-calculate age from date of birth if provided
        if player_data.date_of_birth and not player_data.age:
            calculated_age = calculate_age_from_dob(player_data.date_of_birth)
            if calculated_age:
                player_dict["age"] = calculated_age
        
        # Validate sport-specific requirements
        if player_data.sport:
            # For individual sports, position is optional
            if is_individual_sport(player_data.sport) and not player_data.position:
                player_dict["position"] = None
            
            # Validate position against sport if provided
            if player_data.position and player_data.sport in SPORT_POSITIONS:
                valid_positions = SPORT_POSITIONS[player_data.sport]
                if player_data.position not in valid_positions:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Invalid position '{player_data.position}' for sport '{player_data.sport}'"
                    )
        
        # Auto-generate login credentials if email is provided
        supabase_user_id = None
        default_password = None
        has_login = False
        
        if player_data.email:
            # Generate default password
            default_password = generate_default_password()
            
            # Create Supabase account for player
            supabase_user_id = await create_player_supabase_account(
                player_data.email, 
                default_password, 
                {
                    "first_name": player_data.first_name,
                    "last_name": player_data.last_name,
                    "academy_id": academy_id
                }
            )
            
            if supabase_user_id:
                has_login = True
        
        # Create new player with authentication fields
        player = Player(
            academy_id=academy_id,
            has_login=has_login,
            default_password=default_password,
            password_changed=False,
            supabase_user_id=supabase_user_id,
            **player_dict
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
        
        # Check for duplicate registration number (if updating registration number)
        if player_data.registration_number is not None:
            existing_registration = await db.players.find_one({
                "academy_id": academy_id,
                "registration_number": player_data.registration_number,
                "status": "active",
                "id": {"$ne": player_id}  # Exclude current player
            })
            if existing_registration:
                raise HTTPException(
                    status_code=400,
                    detail=f"Registration number {player_data.registration_number} is already taken"
                )
        
        # Prepare update data with enhancements
        update_data = {k: v for k, v in player_data.dict().items() if v is not None}
        
        # Auto-calculate age from date of birth if provided
        if player_data.date_of_birth and not player_data.age:
            calculated_age = calculate_age_from_dob(player_data.date_of_birth)
            if calculated_age:
                update_data["age"] = calculated_age
        
        # Validate sport-specific requirements if sport is being updated
        if player_data.sport:
            # For individual sports, position can be None
            if is_individual_sport(player_data.sport) and not update_data.get("position"):
                update_data["position"] = None
            
            # Validate position against sport if provided
            if update_data.get("position") and player_data.sport in SPORT_POSITIONS:
                valid_positions = SPORT_POSITIONS[player_data.sport]
                if update_data["position"] not in valid_positions:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Invalid position '{update_data['position']}' for sport '{player_data.sport}'"
                    )
        
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

# ========== ATTENDANCE AND PERFORMANCE TRACKING ENDPOINTS ==========

# Mark attendance for players (Academy User)
@api_router.post("/academy/attendance")
async def mark_attendance(attendance_request: AttendanceMarkingRequest, user_info = Depends(require_academy_user)):
    """Mark attendance for multiple players with performance ratings"""
    try:
        academy_id = user_info["academy_id"]
        marked_by = user_info["user"].id
        
        results = []
        for record in attendance_request.attendance_records:
            # Validate player belongs to academy
            player = await db.players.find_one({"id": record.player_id, "academy_id": academy_id})
            if not player:
                continue  # Skip invalid players
            
            # Check if attendance already exists for this date
            existing_attendance = await db.player_attendance.find_one({
                "player_id": record.player_id,
                "academy_id": academy_id,
                "date": record.date
            })
            
            # Get player's sport for performance categories
            player_sport = player.get("sport", "Other")
            
            attendance_data = {
                "player_id": record.player_id,
                "academy_id": academy_id,
                "date": record.date,
                "present": record.present,
                "sport": record.sport or player_sport,  # Use provided sport or player's sport
                "performance_ratings": record.performance_ratings or {},
                "notes": record.notes,
                "marked_by": marked_by,
                "created_at": datetime.utcnow(),
                "id": str(uuid.uuid4())
            }
            
            if existing_attendance:
                # Update existing attendance
                await db.player_attendance.update_one(
                    {"id": existing_attendance["id"]},
                    {"$set": {
                        "present": record.present,
                        "sport": record.sport or player_sport,
                        "performance_ratings": record.performance_ratings or {},
                        "notes": record.notes,
                        "marked_by": marked_by,
                        "updated_at": datetime.utcnow()
                    }}
                )
                results.append({"player_id": record.player_id, "status": "updated"})
            else:
                # Create new attendance record
                await db.player_attendance.insert_one(attendance_data)
                results.append({"player_id": record.player_id, "status": "created"})
        
        return {"message": "Attendance marked successfully", "results": results}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking attendance: {e}")
        raise HTTPException(status_code=500, detail="Failed to mark attendance")

# Get attendance for a specific date (Academy User)
@api_router.get("/academy/attendance/{date}")
async def get_attendance_by_date(date: str, user_info = Depends(require_academy_user)):
    """Get attendance records for a specific date"""
    try:
        academy_id = user_info["academy_id"]
        
        # Get attendance records for the date
        attendance_cursor = db.player_attendance.find({
            "academy_id": academy_id,
            "date": date
        })
        attendance_records = await attendance_cursor.to_list(length=None)
        
        # Get player details for each attendance record
        results = []
        for record in attendance_records:
            player = await db.players.find_one({"id": record["player_id"]})
            if player:
                results.append({
                    "attendance_id": record["id"],
                    "player_id": record["player_id"],
                    "player_name": f"{player['first_name']} {player['last_name']}",
                    "present": record["present"],
                    "performance_rating": record.get("performance_rating"),
                    "notes": record.get("notes"),
                    "marked_at": record["created_at"]
                })
        
        return {"date": date, "attendance_records": results}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching attendance: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch attendance")

# Get player performance analytics (Academy User)
@api_router.get("/academy/players/{player_id}/performance", response_model=PlayerPerformanceAnalytics)
async def get_player_performance(player_id: str, user_info = Depends(require_academy_user)):
    """Get comprehensive performance analytics for a specific player"""
    try:
        academy_id = user_info["academy_id"]
        
        # Validate player belongs to academy
        player = await db.players.find_one({"id": player_id, "academy_id": academy_id})
        if not player:
            raise HTTPException(status_code=404, detail="Player not found")
        
        # Get all attendance records for the player
        attendance_cursor = db.player_attendance.find({
            "player_id": player_id,
            "academy_id": academy_id
        }).sort("date", -1)
        attendance_records = await attendance_cursor.to_list(length=None)
        
        total_sessions = len(attendance_records)
        attended_sessions = sum(1 for record in attendance_records if record["present"])
        attendance_percentage = (attended_sessions / total_sessions * 100) if total_sessions > 0 else 0
        
        # Get player's sport and performance categories
        player_sport = player.get("sport", "Other")
        performance_categories = get_sport_performance_categories(player_sport)
        
        # Calculate category averages
        category_averages = {}
        category_trends = {}
        overall_ratings = []
        
        for category in performance_categories:
            category_ratings = []
            category_trend = []
            
            for record in attendance_records:
                if record["present"] and record.get("performance_ratings", {}).get(category):
                    rating = record["performance_ratings"][category]
                    category_ratings.append(rating)
                    overall_ratings.append(rating)
                    
                    # Add to trend data
                    category_trend.append({
                        "date": record["date"],
                        "rating": rating
                    })
            
            # Calculate average for this category
            if category_ratings:
                category_averages[category] = round(sum(category_ratings) / len(category_ratings), 2)
                category_trends[category] = sorted(category_trend, key=lambda x: x["date"])[-10:]  # Last 10 sessions
            else:
                category_averages[category] = None
                category_trends[category] = []
        
        # Calculate overall average
        overall_average_rating = round(sum(overall_ratings) / len(overall_ratings), 2) if overall_ratings else None
        
        # Generate overall performance trend (last 30 days)
        from datetime import datetime, timedelta
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_records = [record for record in attendance_records 
                         if datetime.fromisoformat(record["date"]) >= thirty_days_ago]
        
        performance_trend = []
        for record in sorted(recent_records, key=lambda x: x["date"])[-10:]:  # Last 10 sessions
            if record["present"] and record.get("performance_ratings"):
                session_ratings = [rating for rating in record["performance_ratings"].values() if rating]
                if session_ratings:
                    avg_rating = sum(session_ratings) / len(session_ratings)
                    performance_trend.append({
                        "date": record["date"],
                        "rating": round(avg_rating, 2),
                        "categories": record["performance_ratings"]
                    })
        
        # Monthly statistics with category breakdown
        monthly_stats = {}
        for record in attendance_records:
            month_key = record["date"][:7]  # YYYY-MM
            if month_key not in monthly_stats:
                monthly_stats[month_key] = {
                    "total_sessions": 0,
                    "attended_sessions": 0,
                    "category_ratings": {cat: [] for cat in performance_categories}
                }
            monthly_stats[month_key]["total_sessions"] += 1
            if record["present"]:
                monthly_stats[month_key]["attended_sessions"] += 1
                if record.get("performance_ratings"):
                    for category in performance_categories:
                        if category in record["performance_ratings"] and record["performance_ratings"][category]:
                            monthly_stats[month_key]["category_ratings"][category].append(record["performance_ratings"][category])
        
        # Calculate monthly averages
        for month, stats in monthly_stats.items():
            stats["attendance_percentage"] = (stats["attended_sessions"] / stats["total_sessions"] * 100) if stats["total_sessions"] > 0 else 0
            stats["category_averages"] = {}
            overall_month_ratings = []
            
            for category in performance_categories:
                ratings = stats["category_ratings"][category]
                if ratings:
                    avg = sum(ratings) / len(ratings)
                    stats["category_averages"][category] = round(avg, 2)
                    overall_month_ratings.extend(ratings)
                else:
                    stats["category_averages"][category] = None
            
            stats["overall_average"] = round(sum(overall_month_ratings) / len(overall_month_ratings), 2) if overall_month_ratings else None
            del stats["category_ratings"]  # Remove raw ratings from response
        
        return PlayerPerformanceAnalytics(
            player_id=player_id,
            player_name=f"{player['first_name']} {player['last_name']}",
            sport=player_sport,
            total_sessions=total_sessions,
            attended_sessions=attended_sessions,
            attendance_percentage=round(attendance_percentage, 2),
            category_averages=category_averages,
            overall_average_rating=overall_average_rating,
            performance_trend=performance_trend,
            monthly_stats=monthly_stats,
            category_trends=category_trends
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching player performance: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch player performance")

# Get attendance summary for academy (Academy User)
@api_router.get("/academy/attendance/summary")
async def get_attendance_summary(start_date: str = None, end_date: str = None, user_info = Depends(require_academy_user)):
    """Get attendance summary for academy within date range"""
    try:
        academy_id = user_info["academy_id"]
        
        # Build date filter
        date_filter = {"academy_id": academy_id}
        if start_date and end_date:
            date_filter["date"] = {"$gte": start_date, "$lte": end_date}
        elif start_date:
            date_filter["date"] = {"$gte": start_date}
        elif end_date:
            date_filter["date"] = {"$lte": end_date}
        
        # Get attendance records
        attendance_cursor = db.player_attendance.find(date_filter)
        attendance_records = await attendance_cursor.to_list(length=None)
        
        # Calculate summary statistics
        total_records = len(attendance_records)
        present_records = sum(1 for record in attendance_records if record["present"])
        overall_attendance_rate = (present_records / total_records * 100) if total_records > 0 else 0
        
        # Get performance ratings
        performance_ratings = [record.get("performance_rating") for record in attendance_records 
                             if record.get("performance_rating") is not None and record["present"]]
        average_performance = sum(performance_ratings) / len(performance_ratings) if performance_ratings else None
        
        return {
            "date_range": {"start": start_date, "end": end_date},
            "total_records": total_records,
            "present_records": present_records,
            "overall_attendance_rate": round(overall_attendance_rate, 2),
            "average_performance_rating": round(average_performance, 2) if average_performance else None,
            "total_performance_ratings": len(performance_ratings)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching attendance summary: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch attendance summary")

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

# ========== ACADEMY SETTINGS MODELS ==========

class AcademySettings(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    academy_id: str
    
    # Branding Settings (Academy can edit)
    logo_url: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    social_media: Optional[Dict[str, str]] = None  # {"facebook": "url", "twitter": "url", etc.}
    theme_color: Optional[str] = "#0ea5e9"  # Default sky-500
    
    # Operational Settings (Academy can edit)
    season_start_date: Optional[str] = None
    season_end_date: Optional[str] = None
    training_days: Optional[List[str]] = None  # ["Monday", "Wednesday", "Friday"]
    training_time: Optional[str] = None  # "6:00 PM - 8:00 PM"
    facility_address: Optional[str] = None
    facility_amenities: Optional[List[str]] = None  # ["Gym", "Pool", "Field"]
    
    # Notification Settings (Academy can edit)
    email_notifications: Optional[bool] = True
    sms_notifications: Optional[bool] = False
    parent_notifications: Optional[bool] = True
    coach_notifications: Optional[bool] = True
    
    # Privacy Settings (Academy can edit)
    public_profile: Optional[bool] = False
    show_player_stats: Optional[bool] = True
    show_coach_info: Optional[bool] = True
    data_sharing_consent: Optional[bool] = False
    
    # System Settings (Read-only for academy, set by admin)
    max_file_upload_size: Optional[int] = 5  # MB
    allowed_file_types: Optional[List[str]] = ["jpg", "jpeg", "png", "pdf"]
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class AcademySettingsCreate(BaseModel):
    # Branding Settings
    description: Optional[str] = None
    website: Optional[str] = None
    social_media: Optional[Dict[str, str]] = None
    theme_color: Optional[str] = "#0ea5e9"
    
    # Operational Settings
    season_start_date: Optional[str] = None
    season_end_date: Optional[str] = None
    training_days: Optional[List[str]] = None
    training_time: Optional[str] = None
    facility_address: Optional[str] = None
    facility_amenities: Optional[List[str]] = None
    
    # Notification Settings
    email_notifications: Optional[bool] = True
    sms_notifications: Optional[bool] = False
    parent_notifications: Optional[bool] = True
    coach_notifications: Optional[bool] = True
    
    # Privacy Settings
    public_profile: Optional[bool] = False
    show_player_stats: Optional[bool] = True
    show_coach_info: Optional[bool] = True
    data_sharing_consent: Optional[bool] = False

class AcademySettingsUpdate(BaseModel):
    # Branding Settings
    logo_url: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    social_media: Optional[Dict[str, str]] = None
    theme_color: Optional[str] = None
    
    # Operational Settings
    season_start_date: Optional[str] = None
    season_end_date: Optional[str] = None
    training_days: Optional[List[str]] = None
    training_time: Optional[str] = None
    facility_address: Optional[str] = None
    facility_amenities: Optional[List[str]] = None
    
    # Notification Settings
    email_notifications: Optional[bool] = None
    sms_notifications: Optional[bool] = None
    parent_notifications: Optional[bool] = None
    coach_notifications: Optional[bool] = None
    
    # Privacy Settings
    public_profile: Optional[bool] = None
    show_player_stats: Optional[bool] = None
    show_coach_info: Optional[bool] = None
    data_sharing_consent: Optional[bool] = None

# ========== ACADEMY SETTINGS ENDPOINTS ==========

# Get academy settings (Academy User)
@api_router.get("/academy/settings", response_model=AcademySettings)
async def get_academy_settings(user_info = Depends(require_academy_user)):
    """Get academy settings for the authenticated academy"""
    try:
        academy_id = user_info["academy_id"]
        
        # Check if settings exist
        settings = await db.academy_settings.find_one({"academy_id": academy_id})
        
        if not settings:
            # Create default settings if none exist
            default_settings = AcademySettings(academy_id=academy_id)
            settings_dict = default_settings.dict()
            await db.academy_settings.insert_one(settings_dict)
            return default_settings
        
        return AcademySettings(**settings)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching academy settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch academy settings")

# Update academy settings (Academy User)
@api_router.put("/academy/settings", response_model=AcademySettings)
async def update_academy_settings(
    settings_data: AcademySettingsUpdate, 
    user_info = Depends(require_academy_user)
):
    """Update academy settings for the authenticated academy"""
    try:
        academy_id = user_info["academy_id"]
        
        # Prepare update data
        update_data = {k: v for k, v in settings_data.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        # Update settings using upsert
        result = await db.academy_settings.update_one(
            {"academy_id": academy_id},
            {"$set": update_data},
            upsert=True
        )
        
        # Get updated settings
        updated_settings = await db.academy_settings.find_one({"academy_id": academy_id})
        return AcademySettings(**updated_settings)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating academy settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to update academy settings")

# Upload academy logo (Academy User)
@api_router.post("/academy/logo")
async def upload_academy_logo(
    file: UploadFile = File(...),
    user_info = Depends(require_academy_user)
):
    """Upload academy logo"""
    try:
        academy_id = user_info["academy_id"]
        
        # Validate file type
        if file.content_type not in ["image/jpeg", "image/jpg", "image/png"]:
            raise HTTPException(
                status_code=400,
                detail="File must be an image (JPEG, JPG, or PNG)"
            )
        
        # Generate unique filename
        file_extension = file.filename.split('.')[-1].lower()
        filename = f"{academy_id}_{uuid.uuid4()}.{file_extension}"
        file_path = UPLOAD_DIR / filename
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Generate URL
        logo_url = f"/uploads/logos/{filename}"
        
        # Update academy settings with new logo URL
        await db.academy_settings.update_one(
            {"academy_id": academy_id},
            {
                "$set": {
                    "logo_url": logo_url,
                    "updated_at": datetime.utcnow()
                }
            },
            upsert=True
        )
        
        return {"logo_url": logo_url, "message": "Logo uploaded successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading academy logo: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload logo")

# ========== ACADEMY ANALYTICS MODELS ==========

class PlayerAnalytics(BaseModel):
    total_players: int
    active_players: int
    inactive_players: int
    age_distribution: Dict[str, int]  # {"under_18": 15, "18_25": 20, "over_25": 5}
    position_distribution: Dict[str, int]  # {"forward": 10, "midfielder": 8, etc.}
    status_distribution: Dict[str, int]  # {"active": 35, "inactive": 5}
    recent_additions: int  # players added in last 30 days

class CoachAnalytics(BaseModel):
    total_coaches: int
    active_coaches: int
    inactive_coaches: int
    specialization_distribution: Dict[str, int]  # {"fitness": 2, "technical": 3}
    experience_distribution: Dict[str, int]  # {"0_2_years": 1, "3_5_years": 2}
    average_experience: float
    recent_additions: int  # coaches added in last 30 days

class GrowthMetrics(BaseModel):
    monthly_player_growth: List[Dict[str, Any]]  # [{"month": "Jan", "count": 5}]
    monthly_coach_growth: List[Dict[str, Any]]
    yearly_summary: Dict[str, int]  # {"players_added": 25, "coaches_added": 3}

class OperationalMetrics(BaseModel):
    capacity_utilization: Dict[str, float]  # {"players": 70.0, "coaches": 80.0}
    academy_age: int  # days since academy creation
    settings_completion: float  # percentage of settings filled out
    recent_activity: Dict[str, int]  # {"players_updated": 5, "coaches_updated": 2}

class AcademyAnalytics(BaseModel):
    academy_id: str
    academy_name: str
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Core Analytics
    player_analytics: PlayerAnalytics
    coach_analytics: CoachAnalytics
    growth_metrics: GrowthMetrics
    operational_metrics: OperationalMetrics
    
    # Quick Stats
    total_members: int  # players + coaches
    monthly_growth_rate: float
    capacity_usage: float

# ========== ACADEMY ANALYTICS ENDPOINTS ==========

# Get comprehensive academy analytics (Academy User)
@api_router.get("/academy/analytics", response_model=AcademyAnalytics)
async def get_academy_analytics(user_info = Depends(require_academy_user)):
    """Get comprehensive analytics for the authenticated academy"""
    try:
        academy_id = user_info["academy_id"]
        academy_name = user_info["academy"]["name"]
        
        # Get players and coaches
        players = await db.players.find({"academy_id": academy_id}).to_list(1000)
        coaches = await db.coaches.find({"academy_id": academy_id}).to_list(100)
        academy_data = await db.academies.find_one({"id": academy_id})
        
        # Calculate player analytics
        total_players = len(players)
        active_players = len([p for p in players if p.get("status") == "active"])
        inactive_players = total_players - active_players
        
        # Age distribution
        age_distribution = {"under_18": 0, "18_25": 0, "over_25": 0}
        position_distribution = {}
        status_distribution = {"active": 0, "inactive": 0}
        
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_player_additions = 0
        
        for player in players:
            # Age distribution
            age = player.get("age", 0)
            if age < 18:
                age_distribution["under_18"] += 1
            elif age <= 25:
                age_distribution["18_25"] += 1
            else:
                age_distribution["over_25"] += 1
            
            # Position distribution
            position = player.get("position", "Unknown")
            position_distribution[position] = position_distribution.get(position, 0) + 1
            
            # Status distribution
            status = player.get("status", "inactive")
            status_distribution[status] = status_distribution.get(status, 0) + 1
            
            # Recent additions
            created_at = player.get("created_at")
            if created_at and isinstance(created_at, datetime) and created_at >= thirty_days_ago:
                recent_player_additions += 1
        
        player_analytics = PlayerAnalytics(
            total_players=total_players,
            active_players=active_players,
            inactive_players=inactive_players,
            age_distribution=age_distribution,
            position_distribution=position_distribution,
            status_distribution=status_distribution,
            recent_additions=recent_player_additions
        )
        
        # Calculate coach analytics
        total_coaches = len(coaches)
        active_coaches = len([c for c in coaches if c.get("status") == "active"])
        inactive_coaches = total_coaches - active_coaches
        
        specialization_distribution = {}
        experience_distribution = {"0_2_years": 0, "3_5_years": 0, "6_10_years": 0, "over_10_years": 0}
        total_experience = 0
        recent_coach_additions = 0
        
        for coach in coaches:
            # Specialization distribution
            specialization = coach.get("specialization", "General")
            specialization_distribution[specialization] = specialization_distribution.get(specialization, 0) + 1
            
            # Experience distribution
            experience_years = coach.get("experience_years", 0)
            total_experience += experience_years
            
            if experience_years <= 2:
                experience_distribution["0_2_years"] += 1
            elif experience_years <= 5:
                experience_distribution["3_5_years"] += 1
            elif experience_years <= 10:
                experience_distribution["6_10_years"] += 1
            else:
                experience_distribution["over_10_years"] += 1
            
            # Recent additions
            created_at = coach.get("created_at")
            if created_at and isinstance(created_at, datetime) and created_at >= thirty_days_ago:
                recent_coach_additions += 1
        
        average_experience = total_experience / total_coaches if total_coaches > 0 else 0
        
        coach_analytics = CoachAnalytics(
            total_coaches=total_coaches,
            active_coaches=active_coaches,
            inactive_coaches=inactive_coaches,
            specialization_distribution=specialization_distribution,
            experience_distribution=experience_distribution,
            average_experience=round(average_experience, 1),
            recent_additions=recent_coach_additions
        )
        
        # Calculate growth metrics (simplified for now)
        monthly_player_growth = [{"month": "Current", "count": recent_player_additions}]
        monthly_coach_growth = [{"month": "Current", "count": recent_coach_additions}]
        yearly_summary = {"players_added": total_players, "coaches_added": total_coaches}
        
        growth_metrics = GrowthMetrics(
            monthly_player_growth=monthly_player_growth,
            monthly_coach_growth=monthly_coach_growth,
            yearly_summary=yearly_summary
        )
        
        # Calculate operational metrics
        player_limit = academy_data.get("player_limit", 50)
        coach_limit = academy_data.get("coach_limit", 10)
        
        player_capacity = (total_players / player_limit * 100) if player_limit > 0 else 0
        coach_capacity = (total_coaches / coach_limit * 100) if coach_limit > 0 else 0
        
        academy_created = academy_data.get("created_at", datetime.utcnow())
        academy_age = (datetime.utcnow() - academy_created).days if isinstance(academy_created, datetime) else 0
        
        # Check settings completion (simplified)
        settings = await db.academy_settings.find_one({"academy_id": academy_id})
        settings_filled = 0
        total_settings = 10  # approximate number of key settings
        
        if settings:
            key_fields = ["description", "website", "facility_address", "training_days", "training_time"]
            settings_filled = sum(1 for field in key_fields if settings.get(field))
        
        settings_completion = (settings_filled / total_settings * 100)
        
        operational_metrics = OperationalMetrics(
            capacity_utilization={"players": round(player_capacity, 1), "coaches": round(coach_capacity, 1)},
            academy_age=academy_age,
            settings_completion=round(settings_completion, 1),
            recent_activity={"players_updated": recent_player_additions, "coaches_updated": recent_coach_additions}
        )
        
        # Calculate summary metrics
        total_members = total_players + total_coaches
        monthly_growth_rate = ((recent_player_additions + recent_coach_additions) / max(total_members, 1)) * 100
        capacity_usage = (player_capacity + coach_capacity) / 2
        
        return AcademyAnalytics(
            academy_id=academy_id,
            academy_name=academy_name,
            player_analytics=player_analytics,
            coach_analytics=coach_analytics,
            growth_metrics=growth_metrics,
            operational_metrics=operational_metrics,
            total_members=total_members,
            monthly_growth_rate=round(monthly_growth_rate, 1),
            capacity_usage=round(capacity_usage, 1)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching academy analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch academy analytics")

# Get player-specific analytics (Academy User)
@api_router.get("/academy/analytics/players", response_model=PlayerAnalytics)
async def get_player_analytics(user_info = Depends(require_academy_user)):
    """Get detailed player analytics for the authenticated academy"""
    try:
        academy_id = user_info["academy_id"]
        
        # Get comprehensive analytics and return just player analytics
        analytics = await get_academy_analytics(user_info)
        return analytics.player_analytics
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching player analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch player analytics")

# Get coach-specific analytics (Academy User)
@api_router.get("/academy/analytics/coaches", response_model=CoachAnalytics)
async def get_coach_analytics(user_info = Depends(require_academy_user)):
    """Get detailed coach analytics for the authenticated academy"""
    try:
        academy_id = user_info["academy_id"]
        
        # Get comprehensive analytics and return just coach analytics
        analytics = await get_academy_analytics(user_info)
        return analytics.coach_analytics
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching coach analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch coach analytics")

# ========== PLAYER AUTHENTICATION ENDPOINTS ==========

# Player Login
@api_router.post("/player/auth/login", response_model=PlayerAuthResponse)
async def player_login(request: PlayerSignInRequest):
    """Player login endpoint"""
    try:
        response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        
        if response.user:
            # Verify this is a player account
            player = await db.players.find_one({"supabase_user_id": response.user.id})
            if not player:
                raise HTTPException(status_code=403, detail="Account is not associated with a player profile")
            
            return PlayerAuthResponse(
                player=response.user.model_dump() if hasattr(response.user, 'model_dump') else dict(response.user),
                session=response.session.model_dump() if hasattr(response.session, 'model_dump') else dict(response.session),
                message="Player login successful"
            )
        else:
            raise HTTPException(status_code=401, detail="Invalid email or password")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Player login error: {e}")
        raise HTTPException(status_code=400, detail="Login failed")

# Get Player Profile
@api_router.get("/player/profile")
async def get_player_profile(user_info = Depends(require_player_user)):
    """Get player profile information"""
    try:
        player = user_info["player"]
        
        # Get academy information
        academy = await db.academies.find_one({"id": player["academy_id"]})
        
        # Create clean player data without MongoDB ObjectId
        player_data = {
            "id": player.get("id"),
            "first_name": player.get("first_name"),
            "last_name": player.get("last_name"),
            "email": player.get("email"),
            "phone": player.get("phone"),
            "date_of_birth": player.get("date_of_birth"),
            "age": player.get("age"),
            "gender": player.get("gender"),
            "sport": player.get("sport"),
            "position": player.get("position"),
            "registration_number": player.get("registration_number"),
            "height": player.get("height"),
            "weight": player.get("weight"),
            "photo_url": player.get("photo_url"),
            "training_days": player.get("training_days", []),
            "training_batch": player.get("training_batch"),
            "emergency_contact_name": player.get("emergency_contact_name"),
            "emergency_contact_phone": player.get("emergency_contact_phone"),
            "medical_notes": player.get("medical_notes"),
            "status": player.get("status"),
            "academy_id": player.get("academy_id"),
            "created_at": player.get("created_at").isoformat() if player.get("created_at") else None,
            "updated_at": player.get("updated_at").isoformat() if player.get("updated_at") else None
        }
        
        # Create clean academy data
        academy_data = None
        if academy:
            academy_data = {
                "id": academy.get("id"),
                "name": academy.get("name"),
                "logo_url": academy.get("logo_url"),
                "location": academy.get("location"),
                "sports_type": academy.get("sports_type")
            }
        
        return {
            "player": player_data,
            "academy": academy_data
        }
    except Exception as e:
        logger.error(f"Error fetching player profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch player profile")

# Update Player Password
@api_router.put("/player/change-password")
async def change_player_password(request: PlayerPasswordChangeRequest, user_info = Depends(require_player_user)):
    """Change player password"""
    try:
        # Verify current password by attempting to sign in
        try:
            supabase.auth.sign_in_with_password({
                "email": user_info["user"].email,
                "password": request.current_password
            })
        except:
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        
        # Update password in Supabase
        supabase.auth.update_user({
            "password": request.new_password
        })
        
        # Mark password as changed in database
        await db.players.update_one(
            {"id": user_info["player_id"]},
            {"$set": {"password_changed": True, "updated_at": datetime.utcnow()}}
        )
        
        return {"message": "Password changed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error changing player password: {e}")
        raise HTTPException(status_code=500, detail="Failed to change password")

# ========== PLAYER DASHBOARD ENDPOINTS ==========

# Get Player Attendance History
@api_router.get("/player/attendance")
async def get_player_attendance_history(user_info = Depends(require_player_user)):
    """Get player's attendance history"""
    try:
        player_id = user_info["player_id"]
        
        # Get attendance records for this player
        attendance_records_raw = await db.player_attendance.find(
            {"player_id": player_id}
        ).sort("date", -1).limit(100).to_list(100)
        
        # Clean attendance records for JSON serialization
        attendance_records = []
        for record in attendance_records_raw:
            clean_record = {
                "id": record.get("id"),
                "player_id": record.get("player_id"),
                "academy_id": record.get("academy_id"),
                "date": record.get("date"),
                "present": record.get("present"),
                "sport": record.get("sport"),
                "performance_ratings": record.get("performance_ratings", {}),
                "notes": record.get("notes"),
                "marked_by": record.get("marked_by"),
                "created_at": record.get("created_at").isoformat() if record.get("created_at") else None
            }
            attendance_records.append(clean_record)
        
        # Calculate attendance statistics
        total_sessions = len(attendance_records)
        attended_sessions = len([r for r in attendance_records if r.get("present", False)])
        attendance_percentage = (attended_sessions / total_sessions * 100) if total_sessions > 0 else 0
        
        return {
            "attendance_records": attendance_records,
            "statistics": {
                "total_sessions": total_sessions,
                "attended_sessions": attended_sessions,
                "missed_sessions": total_sessions - attended_sessions,
                "attendance_percentage": round(attendance_percentage, 2)
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching player attendance: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch attendance history")

# Get Player Performance Stats
@api_router.get("/player/performance")
async def get_player_performance_stats(user_info = Depends(require_player_user)):
    """Get player's performance statistics"""
    try:
        player_id = user_info["player_id"]
        player = user_info["player"]
        
        # Get performance data from attendance records
        attendance_records = await db.player_attendance.find(
            {"player_id": player_id, "present": True}
        ).sort("date", -1).to_list(100)
        
        # Calculate performance averages
        category_averages = {}
        performance_trend = []
        
        if attendance_records:
            # Get performance categories for this player's sport
            sport_categories = get_sport_performance_categories(player.get("sport", "Other"))
            
            # Calculate averages for each category
            for category in sport_categories:
                ratings = []
                for record in attendance_records:
                    rating = record.get("performance_ratings", {}).get(category)
                    if rating is not None:
                        ratings.append(rating)
                
                if ratings:
                    category_averages[category] = round(sum(ratings) / len(ratings), 2)
                else:
                    category_averages[category] = 0
            
            # Build performance trend (last 30 days)
            recent_records = attendance_records[:30]
            for record in recent_records:
                performance_trend.append({
                    "date": record.get("date"),
                    "overall_rating": sum(record.get("performance_ratings", {}).values()) / len(record.get("performance_ratings", {})) if record.get("performance_ratings") else 0,
                    "ratings": record.get("performance_ratings", {})
                })
        
        overall_average = sum(category_averages.values()) / len(category_averages) if category_averages else 0
        
        return {
            "player_id": player_id,
            "player_name": f"{player.get('first_name', '')} {player.get('last_name', '')}",
            "sport": player.get("sport"),
            "position": player.get("position"),
            "total_sessions": len(attendance_records),
            "category_averages": category_averages,
            "overall_average_rating": round(overall_average, 2),
            "performance_trend": performance_trend[:10]  # Last 10 sessions
        }
        
    except Exception as e:
        logger.error(f"Error fetching player performance: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch performance statistics")

# Get Player Announcements
@api_router.get("/player/announcements")
async def get_player_announcements(user_info = Depends(require_player_user)):
    """Get announcements for the player"""
    try:
        player_id = user_info["player_id"]
        academy_id = user_info["academy_id"]
        
        # Get announcements targeted to this player or all players
        announcements_raw = await db.announcements.find({
            "academy_id": academy_id,
            "is_active": True,
            "$or": [
                {"target_audience": "all"},
                {"target_audience": "players"},
                {"target_audience": "specific_player", "target_player_id": player_id}
            ]
        }).sort("created_at", -1).to_list(50)
        
        # Clean announcements for JSON serialization
        announcements = []
        for announcement in announcements_raw:
            clean_announcement = {
                "id": announcement.get("id"),
                "academy_id": announcement.get("academy_id"),
                "title": announcement.get("title"),
                "content": announcement.get("content"),
                "priority": announcement.get("priority"),
                "target_audience": announcement.get("target_audience"),
                "target_player_id": announcement.get("target_player_id"),
                "is_active": announcement.get("is_active"),
                "created_by": announcement.get("created_by"),
                "created_at": announcement.get("created_at").isoformat() if announcement.get("created_at") else None,
                "updated_at": announcement.get("updated_at").isoformat() if announcement.get("updated_at") else None
            }
            announcements.append(clean_announcement)
        
        return {"announcements": announcements}
        
    except Exception as e:
        logger.error(f"Error fetching player announcements: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch announcements")

# ========== THEME PREFERENCE ENDPOINTS ==========

# Get Theme Preference
@api_router.get("/theme")
async def get_theme_preference():
    """Get global theme preference"""
    try:
        theme_pref = await db.theme_preferences.find_one({})
        if not theme_pref:
            # Create default theme preference
            default_theme = ThemePreference()
            await db.theme_preferences.insert_one(default_theme.dict())
            return {"theme": "light"}
        
        return {"theme": theme_pref.get("theme", "light")}
        
    except Exception as e:
        logger.error(f"Error fetching theme preference: {e}")
        return {"theme": "light"}  # Default fallback

# Update Theme Preference
@api_router.put("/theme")
async def update_theme_preference(theme: str):
    """Update global theme preference"""
    try:
        if theme not in ["light", "dark"]:
            raise HTTPException(status_code=400, detail="Theme must be 'light' or 'dark'")
        
        # Update or create theme preference
        await db.theme_preferences.update_one(
            {},
            {"$set": {"theme": theme, "updated_at": datetime.utcnow()}},
            upsert=True
        )
        
        return {"message": "Theme updated successfully", "theme": theme}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating theme preference: {e}")
        raise HTTPException(status_code=500, detail="Failed to update theme preference")

# ========== ANNOUNCEMENT MANAGEMENT ENDPOINTS ==========

# Get Academy Announcements (Academy User)
@api_router.get("/academy/announcements")
async def get_academy_announcements(user_info = Depends(require_academy_user)):
    """Get all announcements for the academy"""
    try:
        academy_id = user_info["academy_id"]
        
        announcements = await db.announcements.find(
            {"academy_id": academy_id}
        ).sort("created_at", -1).to_list(100)
        
        return {"announcements": announcements}
        
    except Exception as e:
        logger.error(f"Error fetching academy announcements: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch announcements")

# Create Academy Announcement (Academy User)
@api_router.post("/academy/announcements", response_model=Announcement)
async def create_academy_announcement(announcement_data: AnnouncementCreate, user_info = Depends(require_academy_user)):
    """Create a new announcement for the academy"""
    try:
        academy_id = user_info["academy_id"]
        user_id = user_info["user"].id
        
        announcement = Announcement(
            academy_id=academy_id,
            created_by=user_id,
            **announcement_data.dict()
        )
        
        await db.announcements.insert_one(announcement.dict())
        
        return announcement
        
    except Exception as e:
        logger.error(f"Error creating announcement: {e}")
        raise HTTPException(status_code=500, detail="Failed to create announcement")

# Update Academy Announcement (Academy User)
@api_router.put("/academy/announcements/{announcement_id}", response_model=Announcement)
async def update_academy_announcement(announcement_id: str, announcement_data: AnnouncementUpdate, user_info = Depends(require_academy_user)):
    """Update an academy announcement"""
    try:
        academy_id = user_info["academy_id"]
        
        # Check if announcement exists
        existing_announcement = await db.announcements.find_one({
            "id": announcement_id,
            "academy_id": academy_id
        })
        if not existing_announcement:
            raise HTTPException(status_code=404, detail="Announcement not found")
        
        # Update announcement
        update_data = announcement_data.dict(exclude_unset=True)
        if update_data:
            update_data["updated_at"] = datetime.utcnow()
            await db.announcements.update_one(
                {"id": announcement_id, "academy_id": academy_id},
                {"$set": update_data}
            )
        
        # Get updated announcement
        updated_announcement = await db.announcements.find_one({
            "id": announcement_id,
            "academy_id": academy_id
        })
        return Announcement(**updated_announcement)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating announcement: {e}")
        raise HTTPException(status_code=500, detail="Failed to update announcement")

# Delete Academy Announcement (Academy User)
@api_router.delete("/academy/announcements/{announcement_id}")
async def delete_academy_announcement(announcement_id: str, user_info = Depends(require_academy_user)):
    """Delete an academy announcement"""
    try:
        academy_id = user_info["academy_id"]
        
        # Check if announcement exists
        existing_announcement = await db.announcements.find_one({
            "id": announcement_id,
            "academy_id": academy_id
        })
        if not existing_announcement:
            raise HTTPException(status_code=404, detail="Announcement not found")
        
        # Delete announcement
        await db.announcements.delete_one({
            "id": announcement_id,
            "academy_id": academy_id
        })
        
        return {"message": "Announcement deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting announcement: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete announcement")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://track-my-academy.vercel.app",
        "http://localhost:3000",
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Length", "X-Requested-With"],
    max_age=600,
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
