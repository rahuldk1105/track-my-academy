#!/usr/bin/env python3
"""
Script to create a super admin user
"""
import os
import sys
import uuid
from datetime import datetime, timezone
from pymongo import MongoClient
from passlib.context import CryptContext
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL")
if not MONGO_URL:
    print("Error: MONGO_URL not found in environment variables")
    sys.exit(1)

client = MongoClient(MONGO_URL)
db = client.track_my_academy

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def create_super_admin():
    print("Creating Super Admin User for Track My Academy")
    print("="*50)
    
    # Default super admin credentials
    email = "superadmin@trackmyacademy.com"
    name = "Super Administrator"
    password = "SuperAdmin123!"
    
    # Check if user already exists
    existing_user = db.users.find_one({"email": email})
    if existing_user:
        print(f"Super admin with email {email} already exists!")
        print(f"Email: {email}")
        print(f"Name: {existing_user['name']}")
        print(f"Role: {existing_user['role']}")
        return
    
    # Create super admin user
    user_id = str(uuid.uuid4())
    user_doc = {
        "user_id": user_id,
        "email": email,
        "role": "super_admin",
        "name": name,
        "academy_id": None,  # Super admin doesn't belong to any specific academy
        "hashed_password": get_password_hash(password),
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    }
    
    try:
        db.users.insert_one(user_doc)
        print(f"\n✅ Super admin user created successfully!")
        print(f"Email: {email}")
        print(f"Password: {password}")
        print(f"Name: {name}")
        print(f"Role: super_admin")
        print(f"User ID: {user_id}")
        print(f"\nYou can now login with these credentials.")
        
    except Exception as e:
        print(f"❌ Error creating super admin: {str(e)}")

if __name__ == "__main__":
    create_super_admin()