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
    
    # Get user input
    email = input("Enter super admin email: ").strip()
    if not email:
        print("Email is required!")
        return
    
    name = input("Enter super admin name: ").strip()
    if not name:
        print("Name is required!")
        return
    
    password = input("Enter password: ").strip()
    if not password:
        print("Password is required!")
        return
    
    # Check if user already exists
    existing_user = db.users.find_one({"email": email})
    if existing_user:
        print(f"User with email {email} already exists!")
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
        print(f"Name: {name}")
        print(f"Role: super_admin")
        print(f"User ID: {user_id}")
        print(f"\nYou can now login with these credentials.")
        
    except Exception as e:
        print(f"❌ Error creating super admin: {str(e)}")

if __name__ == "__main__":
    create_super_admin()