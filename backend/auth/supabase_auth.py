import jwt
import time
from typing import Dict, Optional
from fastapi import HTTPException, status, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from decouple import config
import httpx
import logging

logger = logging.getLogger(__name__)

class SupabaseAuthService:
    def __init__(self):
        self.supabase_url = config("SUPABASE_URL")
        self.supabase_anon_key = config("SUPABASE_ANON_KEY")
        self.supabase_service_key = config("SUPABASE_SERVICE_ROLE_KEY")
        self.jwt_secret = config("SUPABASE_JWT_SECRET")
        self.jwt_algorithm = config("JWT_ALGORITHM", default="HS256")
    
    def decode_jwt(self, token: str) -> Dict:
        """Decode and validate JWT token"""
        try:
            decoded_token = jwt.decode(
                token, 
                self.jwt_secret, 
                algorithms=[self.jwt_algorithm],
                options={"verify_aud": False}
            )
            
            # Check token expiration
            if decoded_token.get("exp", 0) < time.time():
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token has expired"
                )
            
            return decoded_token
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.JWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token: {str(e)}"
            )
    
    def verify_jwt(self, jwtoken: str) -> bool:
        """Verify if JWT token is valid"""
        try:
            payload = self.decode_jwt(jwtoken)
            return payload is not None
        except HTTPException:
            return False
    
    def get_user_from_token(self, token: str) -> Dict:
        """Extract user information from JWT token"""
        payload = self.decode_jwt(token)
        
        return {
            "user_id": payload.get("sub"),
            "email": payload.get("email"),
            "role": payload.get("user_role", "student"),
            "aal": payload.get("aal", "aal1"),
            "session_id": payload.get("session_id"),
            "app_metadata": payload.get("app_metadata", {}),
            "user_metadata": payload.get("user_metadata", {}),
            "phone": payload.get("phone"),
            "email_confirmed_at": payload.get("email_confirmed_at"),
            "created_at": payload.get("created_at")
        }

    async def create_user_with_role(self, email: str, password: str, user_data: Dict) -> Dict:
        """Create user in Supabase with custom role"""
        try:
            async with httpx.AsyncClient() as client:
                # Create user in Supabase
                response = await client.post(
                    f"{self.supabase_url}/auth/v1/admin/users",
                    json={
                        "email": email,
                        "password": password,
                        "email_confirm": True,  # Auto-confirm for demo
                        "user_metadata": user_data
                    },
                    headers={
                        "apikey": self.supabase_service_key,
                        "Authorization": f"Bearer {self.supabase_service_key}",
                        "Content-Type": "application/json"
                    }
                )
                
                if response.status_code != 200:
                    error_data = response.json()
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=error_data.get("msg", "Failed to create user")
                    )
                
                user_data = response.json()
                return user_data
                
        except httpx.RequestError as e:
            logger.error(f"Network error creating user: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Network error occurred"
            )

# Initialize auth service
supabase_auth = SupabaseAuthService()

class JWTBearer(HTTPBearer):
    def __init__(self, auto_error: bool = True):
        super(JWTBearer, self).__init__(auto_error=auto_error)
    
    async def __call__(self, request: Request) -> Dict:
        credentials: HTTPAuthorizationCredentials = await super(JWTBearer, self).__call__(request)
        
        if credentials:
            if not credentials.scheme == "Bearer":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Invalid authentication scheme"
                )
            
            if not supabase_auth.verify_jwt(credentials.credentials):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Invalid token or expired token"
                )
            
            # Extract user information from token
            user_info = supabase_auth.get_user_from_token(credentials.credentials)
            return user_info
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid authorization code"
            )

# Role-based authentication dependencies
class RoleChecker:
    def __init__(self, allowed_roles: list):
        self.allowed_roles = allowed_roles
    
    def __call__(self, user: Dict = Depends(JWTBearer())) -> Dict:
        if user.get("role") not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {self.allowed_roles}"
            )
        return user

# Convenience functions for different role levels
def require_super_admin():
    return RoleChecker(["super_admin"])

def require_admin():
    return RoleChecker(["super_admin", "admin"])

def require_coach_or_admin():
    return RoleChecker(["super_admin", "admin", "coach"])

def require_any_authenticated():
    return JWTBearer()