#!/usr/bin/env python3
"""
Debug Priority 1 API issues
"""

import requests
import json
import os
from dotenv import load_dotenv

load_dotenv('/app/frontend/.env')
load_dotenv('/app/backend/.env')

BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')
API_BASE_URL = f"{BACKEND_URL}/api"

def get_access_token():
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
        return session.get("access_token")
    return None

def test_debug():
    print("=== Debug Priority 1 APIs ===")
    
    # Get access token
    access_token = get_access_token()
    if not access_token:
        print("❌ Cannot get access token")
        return
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}"
    }
    
    # Test 1: Check user info
    print("\n--- User Info ---")
    response = requests.get(f"{API_BASE_URL}/auth/user", headers=headers, timeout=10)
    if response.status_code == 200:
        user_data = response.json()
        role_info = user_data.get('user', {}).get('role_info', {})
        print(f"Role: {role_info.get('role')}")
        print(f"Academy ID: {role_info.get('academy_id')}")
        print(f"Academy Name: {role_info.get('academy_name')}")
    else:
        print(f"❌ User info failed: {response.status_code}")
        return
    
    # Test 2: Try to access academy players endpoint
    print("\n--- Academy Players Access ---")
    response = requests.get(f"{API_BASE_URL}/academy/players", headers=headers, timeout=10)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        players = response.json()
        print(f"Players count: {len(players)}")
    else:
        print(f"Response: {response.text}")
    
    # Test 3: Try to create a simple player
    print("\n--- Create Simple Player ---")
    player_data = {
        "first_name": "Test",
        "last_name": "Player",
        "email": "test.player@academy.com"
    }
    
    response = requests.post(
        f"{API_BASE_URL}/academy/players",
        json=player_data,
        headers=headers,
        timeout=15
    )
    
    print(f"Create player status: {response.status_code}")
    if response.status_code == 200:
        player = response.json()
        print(f"Created player ID: {player.get('id')}")
        return player.get('id')
    else:
        print(f"Create player error: {response.text}")
        return None

if __name__ == "__main__":
    test_debug()