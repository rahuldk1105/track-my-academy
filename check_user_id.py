#!/usr/bin/env python3
"""
Check user info and update academy record with correct Supabase user ID
"""

import requests
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv('/app/frontend/.env')
load_dotenv('/app/backend/.env')

BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')
API_BASE_URL = f"{BACKEND_URL}/api"

async def check_and_fix_user():
    # Login to get user info
    login_data = {
        "email": "testacademy@roletest.com",
        "password": "TestAcademy123!"
    }
    
    response = requests.post(
        f"{API_BASE_URL}/auth/login",
        json=login_data,
        headers={"Content-Type": "application/json"},
        timeout=15
    )
    
    if response.status_code == 200:
        data = response.json()
        session = data.get("session", {})
        access_token = session.get("access_token")
        user = data.get("user", {})
        actual_user_id = user.get("id")
        
        print(f"Login successful!")
        print(f"Actual Supabase User ID: {actual_user_id}")
        
        # Get user info to see role details
        headers = {"Authorization": f"Bearer {access_token}"}
        user_response = requests.get(f"{API_BASE_URL}/auth/user", headers=headers, timeout=10)
        
        if user_response.status_code == 200:
            user_data = user_response.json()
            print(f"User info response: {user_data}")
        
        # Update academy record with correct user ID
        mongo_url = os.environ['MONGO_URL']
        client = AsyncIOMotorClient(mongo_url)
        db = client[os.environ['DB_NAME']]
        
        # Update the academy record
        result = await db.academies.update_one(
            {"email": "testacademy@roletest.com"},
            {"$set": {"supabase_user_id": actual_user_id}}
        )
        
        if result.modified_count > 0:
            print("✅ Academy record updated with correct Supabase user ID")
        else:
            print("⚠️ Academy record not updated (may already be correct)")
        
        # Verify the update
        academy = await db.academies.find_one({"email": "testacademy@roletest.com"})
        if academy:
            print(f"Academy record Supabase User ID: {academy.get('supabase_user_id')}")
            if academy.get('supabase_user_id') == actual_user_id:
                print("✅ User ID matches!")
            else:
                print("❌ User ID mismatch!")
        
    else:
        print(f"Login failed: {response.status_code} - {response.text}")

if __name__ == "__main__":
    asyncio.run(check_and_fix_user())