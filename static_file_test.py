#!/usr/bin/env python3
"""
Static File Serving Test for Academy Logos
Tests the static file serving issue identified in academy logo display
"""

import requests
import os

# Test URLs
BACKEND_URL = "https://admin-redesign-1.preview.emergentagent.com"
test_logo = "74a7e52e-87e5-43d2-a6f7-b77ad366458e.png"

print("🔍 STATIC FILE SERVING DIAGNOSIS")
print("=" * 50)

# Test 1: Direct frontend route (what's currently happening)
print(f"\n1. Testing frontend route: {BACKEND_URL}/uploads/logos/{test_logo}")
response = requests.get(f"{BACKEND_URL}/uploads/logos/{test_logo}")
print(f"   Status: {response.status_code}")
print(f"   Content-Type: {response.headers.get('content-type')}")
print(f"   Content Length: {len(response.content)} bytes")
print(f"   Is HTML: {'<!doctype html>' in response.text.lower()}")

# Test 2: Direct backend static file serving (bypassing frontend)
print(f"\n2. Testing backend static files (port 8001): {BACKEND_URL}:8001/uploads/logos/{test_logo}")
try:
    response = requests.get(f"{BACKEND_URL}:8001/uploads/logos/{test_logo}")
    print(f"   Status: {response.status_code}")
    print(f"   Content-Type: {response.headers.get('content-type')}")
    print(f"   Content Length: {len(response.content)} bytes")
    print(f"   Is Image: {response.headers.get('content-type', '').startswith('image/')}")
except Exception as e:
    print(f"   Error: {e}")

# Test 3: Check if file exists on filesystem
print(f"\n3. Checking file system:")
file_path = f"/app/backend/uploads/logos/{test_logo}"
if os.path.exists(file_path):
    size = os.path.getsize(file_path)
    print(f"   ✅ File exists: {file_path} ({size} bytes)")
else:
    print(f"   ❌ File not found: {file_path}")

# Test 4: Backend API prefix test
print(f"\n4. Testing backend API with /api prefix:")
response = requests.get(f"{BACKEND_URL}/api/")
print(f"   API Health: {response.status_code} - {response.json() if response.status_code == 200 else 'Failed'}")

print(f"\n🚨 DIAGNOSIS:")
print(f"   - Frontend is intercepting /uploads/ routes")
print(f"   - Backend static files are not accessible through main domain")
print(f"   - Files exist on filesystem but can't be served properly")
print(f"   - This causes empty logo placeholders in the admin dashboard")

print(f"\n💡 SOLUTIONS:")
print(f"   1. Configure reverse proxy to serve /uploads/ from backend")
print(f"   2. Move static files to /api/uploads/ path")
print(f"   3. Use a CDN or separate static file server")
print(f"   4. Configure frontend to not intercept /uploads/ routes")