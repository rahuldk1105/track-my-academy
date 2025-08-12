#!/usr/bin/env python3
"""
Create test academy record in MongoDB for existing Supabase user
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime
import uuid

# Load environment variables
from dotenv import load_dotenv
load_dotenv('/app/backend/.env')

async def create_test_academy():
    # MongoDB connection
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Test academy data
    academy_data = {
        "id": str(uuid.uuid4()),
        "name": "Role Test Academy",
        "owner_name": "Test Owner",
        "email": "testacademy@roletest.com",
        "phone": "+1-555-0999",
        "location": "Test City, TX",
        "sports_type": "Multi-Sport",
        "logo_url": None,
        "player_limit": 30,
        "coach_limit": 5,
        "status": "approved",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "supabase_user_id": "48633b7f-75e0-4793-9355-d72d5df09c6f"  # From the login response
    }
    
    # Check if academy already exists
    existing = await db.academies.find_one({"email": "testacademy@roletest.com"})
    if existing:
        print("Academy already exists:", existing["id"])
        return existing["id"]
    
    # Insert academy
    result = await db.academies.insert_one(academy_data)
    print("Created academy with ID:", academy_data["id"])
    
    # Verify insertion
    created_academy = await db.academies.find_one({"id": academy_data["id"]})
    if created_academy:
        print("Academy verified in database")
        print(f"  Name: {created_academy['name']}")
        print(f"  Email: {created_academy['email']}")
        print(f"  Player Limit: {created_academy['player_limit']}")
        print(f"  Coach Limit: {created_academy['coach_limit']}")
        print(f"  Supabase User ID: {created_academy['supabase_user_id']}")
    
    return academy_data["id"]

if __name__ == "__main__":
    asyncio.run(create_test_academy())