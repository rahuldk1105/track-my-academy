#!/usr/bin/env python3
"""
Script to create a regular admin user for testing subscription warnings
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
client = MongoClient(MONGO_URL)
db = client.track_my_academy

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def create_admin_user():
    print("Creating Regular Admin User")
    print("="*30)
    
    # Admin credentials for Champions Tennis Academy (expiring soon)
    email = "maria@championstennis.com"
    name = "Maria Rodriguez"
    password = "admin123"
    
    # Check if user already exists
    existing_user = db.users.find_one({"email": email})
    if existing_user:
        print(f"Admin user with email {email} already exists!")
        return
    
    # Create regular admin user
    user_id = str(uuid.uuid4())
    user_doc = {
        "user_id": user_id,
        "email": email,
        "role": "admin",
        "name": name,
        "academy_id": "c479b3c4-7af2-4f37-8665-bd55902a195d",  # Champions Tennis Academy ID
        "hashed_password": get_password_hash(password),
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    }
    
    try:
        db.users.insert_one(user_doc)
        print(f"\n✅ Regular admin user created successfully!")
        print(f"Email: {email}")
        print(f"Password: {password}")
        print(f"Name: {name}")
        print(f"Role: admin")
        print(f"Academy: Champions Tennis Academy (expiring soon)")
        print(f"User ID: {user_id}")
        
    except Exception as e:
        print(f"❌ Error creating admin: {str(e)}")

if __name__ == "__main__":
    create_admin_user()