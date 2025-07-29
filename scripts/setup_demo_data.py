#!/usr/bin/env python3
"""
Demo data setup script for Track My Academy
Creates sample academy, admin user, coaches, and students for testing
"""

import os
import sys
import requests
import uuid
from datetime import datetime, timezone

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from pymongo import MongoClient
from passlib.context import CryptContext
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL")
client = MongoClient(MONGO_URL)
db = client.track_my_academy

# Collections
users_collection = db.users
academies_collection = db.academies
coaches_collection = db.coaches
students_collection = db.students

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def create_demo_data():
    """Create demo data for the application"""
    
    print("🏃‍♂️ Setting up Track My Academy demo data...")
    
    # Clear existing data
    print("🧹 Clearing existing data...")
    users_collection.delete_many({})
    academies_collection.delete_many({})
    coaches_collection.delete_many({})
    students_collection.delete_many({})
    
    # Create Academy
    print("🏫 Creating demo academy...")
    academy_id = str(uuid.uuid4())
    academy_doc = {
        "academy_id": academy_id,
        "academy_name": "Elite Sports Academy",
        "academy_location": "New York, NY",
        "academy_logo_url": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b",
        "admin_email": "admin@academy.com",
        "created_at": datetime.now(timezone.utc)
    }
    academies_collection.insert_one(academy_doc)
    
    # Create Admin User
    print("👨‍💼 Creating admin user...")
    admin_user_id = str(uuid.uuid4())
    admin_user_doc = {
        "user_id": admin_user_id,
        "email": "admin@academy.com",
        "role": "admin",
        "name": "John Admin",
        "academy_id": None,  # Admins can manage multiple academies
        "hashed_password": get_password_hash("password123"),
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    }
    users_collection.insert_one(admin_user_doc)
    
    # Create Demo Coaches
    print("🏃‍♂️ Creating demo coaches...")
    coaches_data = [
        {
            "name": "Mike Johnson",
            "email": "coach@academy.com",
            "specialization": "Basketball",
            "profile_pic": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e",
            "bio": "Former NBA player with 10 years of coaching experience."
        },
        {
            "name": "Sarah Williams",
            "email": "sarah.coach@academy.com", 
            "specialization": "Football",
            "profile_pic": "https://images.unsplash.com/photo-1494790108755-2616b612b5bc",
            "bio": "Professional football coach with expertise in youth development."
        },
        {
            "name": "David Brown",
            "email": "david.coach@academy.com",
            "specialization": "Tennis",
            "profile_pic": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
            "bio": "Tennis instructor specializing in technique and mental game."
        }
    ]
    
    coach_ids = []
    for coach_data in coaches_data:
        coach_id = str(uuid.uuid4())
        user_id = str(uuid.uuid4())
        
        # Create user account
        user_doc = {
            "user_id": user_id,
            "email": coach_data["email"],
            "role": "coach",
            "name": coach_data["name"],
            "academy_id": academy_id,
            "hashed_password": get_password_hash("password123"),
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        }
        users_collection.insert_one(user_doc)
        
        # Create coach profile
        coach_doc = {
            "coach_id": coach_id,
            "name": coach_data["name"],
            "email": coach_data["email"],
            "specialization": coach_data["specialization"],
            "profile_pic": coach_data["profile_pic"],
            "bio": coach_data["bio"],
            "academy_id": academy_id,
            "created_at": datetime.now(timezone.utc)
        }
        coaches_collection.insert_one(coach_doc)
        coach_ids.append(coach_id)
    
    # Create Demo Students
    print("🎓 Creating demo students...")
    students_data = [
        {
            "name": "Alex Thompson",
            "email": "student@academy.com",
            "age": 16,
            "parent_contact": "+1-555-0101",
            "enrolled_program": "Advanced Basketball",
            "performance_score": 8.5,
            "photo": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6"
        },
        {
            "name": "Emma Davis",
            "email": "emma.student@academy.com",
            "age": 15,
            "parent_contact": "+1-555-0102", 
            "enrolled_program": "Junior Football",
            "performance_score": 7.2,
            "photo": "https://images.unsplash.com/photo-1494790108755-2616b612b5bc"
        },
        {
            "name": "Ryan Wilson",
            "email": "ryan.student@academy.com",
            "age": 14,
            "parent_contact": "+1-555-0103",
            "enrolled_program": "Tennis Fundamentals",
            "performance_score": 6.8,
            "photo": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d"
        },
        {
            "name": "Sophia Garcia",
            "email": "sophia.student@academy.com",
            "age": 17,
            "parent_contact": "+1-555-0104",
            "enrolled_program": "Elite Basketball",
            "performance_score": 9.1,
            "photo": "https://images.unsplash.com/photo-1544005313-94ddf0286df2"
        },
        {
            "name": "James Miller",
            "email": "james.student@academy.com",
            "age": 16,
            "parent_contact": "+1-555-0105",
            "enrolled_program": "Football Development",
            "performance_score": 7.8,
            "photo": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e"
        }
    ]
    
    for i, student_data in enumerate(students_data):
        student_id = str(uuid.uuid4())
        user_id = str(uuid.uuid4())
        
        # Assign coaches to students (rotate assignments)
        assigned_coaches = [coach_ids[i % len(coach_ids)]]
        if i % 2 == 0:  # Some students get additional coaches
            assigned_coaches.append(coach_ids[(i + 1) % len(coach_ids)])
        
        # Create user account
        user_doc = {
            "user_id": user_id,
            "email": student_data["email"],
            "role": "student", 
            "name": student_data["name"],
            "academy_id": academy_id,
            "hashed_password": get_password_hash("password123"),
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        }
        users_collection.insert_one(user_doc)
        
        # Create student profile
        student_doc = {
            "student_id": student_id,
            "name": student_data["name"],
            "email": student_data["email"],
            "age": student_data["age"],
            "parent_contact": student_data["parent_contact"],
            "enrolled_program": student_data["enrolled_program"],
            "performance_score": student_data["performance_score"],
            "photo": student_data["photo"],
            "academy_id": academy_id,
            "assigned_coaches": assigned_coaches,
            "created_at": datetime.now(timezone.utc)
        }
        students_collection.insert_one(student_doc)
    
    print("\n✅ Demo data created successfully!")
    print("\n🔐 Demo Login Credentials:")
    print("=" * 50)
    print("Admin Account:")
    print("  Email: admin@academy.com")
    print("  Password: password123")
    print("\nCoach Account:")
    print("  Email: coach@academy.com")
    print("  Password: password123")
    print("\nStudent Account:")
    print("  Email: student@academy.com") 
    print("  Password: password123")
    print("=" * 50)
    
    # Verify data counts
    print(f"\n📊 Data Summary:")
    print(f"  Academies: {academies_collection.count_documents({})}")
    print(f"  Users: {users_collection.count_documents({})}")
    print(f"  Coaches: {coaches_collection.count_documents({})}")
    print(f"  Students: {students_collection.count_documents({})}")
    
    return True

if __name__ == "__main__":
    try:
        create_demo_data()
    except Exception as e:
        print(f"❌ Error creating demo data: {e}")
        sys.exit(1)