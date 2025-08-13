#!/usr/bin/env python3
"""
Academy Logo Issue Testing for Track My Academy
Focused testing for academy logo display issues in super admin dashboard
"""

import requests
import json
import os
from datetime import datetime
import sys

# Load environment variables
from dotenv import load_dotenv
load_dotenv('/app/frontend/.env')
load_dotenv('/app/backend/.env')

# Get backend URL from frontend environment
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')
API_BASE_URL = f"{BACKEND_URL}/api"

print(f"🔍 Testing Academy Logo Issue at: {API_BASE_URL}")
print("=" * 60)

def get_admin_token():
    """Get admin authentication token"""
    print("\n=== Getting Admin Authentication Token ===")
    try:
        login_data = {
            "email": "admin@trackmyacademy.com",
            "password": "AdminPassword123!"
        }
        
        response = requests.post(f"{API_BASE_URL}/auth/login", json=login_data, timeout=10)
        print(f"Login Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            access_token = data.get('session', {}).get('access_token')
            if access_token:
                print("✅ Admin login successful")
                return access_token
            else:
                print("❌ No access token in response")
                return None
        else:
            print(f"❌ Login failed: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def test_academy_data_structure(token):
    """Test 1: Check Academy Data Structure - GET /api/admin/academies"""
    print("\n=== TEST 1: Academy Data Structure ===")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{API_BASE_URL}/admin/academies", headers=headers, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            academies = response.json()
            print(f"Total academies found: {len(academies)}")
            
            if academies:
                print("\n📊 Academy Data Analysis:")
                for i, academy in enumerate(academies, 1):
                    print(f"\nAcademy {i}:")
                    print(f"  - ID: {academy.get('id', 'N/A')}")
                    print(f"  - Name: {academy.get('name', 'N/A')}")
                    print(f"  - Logo URL: {academy.get('logo_url', 'NULL')}")
                    print(f"  - Status: {academy.get('status', 'N/A')}")
                    
                    # Check logo_url field specifically
                    logo_url = academy.get('logo_url')
                    if logo_url:
                        print(f"  - Logo URL Format: {logo_url}")
                        print(f"  - Logo URL Type: {type(logo_url)}")
                    else:
                        print(f"  - ⚠️ Logo URL is missing or null")
                
                # Summary
                academies_with_logos = [a for a in academies if a.get('logo_url')]
                academies_without_logos = [a for a in academies if not a.get('logo_url')]
                
                print(f"\n📈 Logo Summary:")
                print(f"  - Academies with logos: {len(academies_with_logos)}")
                print(f"  - Academies without logos: {len(academies_without_logos)}")
                
                if academies_with_logos:
                    print("✅ TEST 1 PASSED: Academy data structure includes logo_url field")
                    return academies_with_logos
                else:
                    print("⚠️ TEST 1 WARNING: No academies have logo_url values")
                    return []
            else:
                print("⚠️ No academies found in database")
                return []
        else:
            print(f"❌ TEST 1 FAILED: {response.text}")
            return []
            
    except Exception as e:
        print(f"❌ TEST 1 ERROR: {e}")
        return []

def test_static_file_serving(academies_with_logos):
    """Test 2: Test Static File Serving"""
    print("\n=== TEST 2: Static File Serving ===")
    
    # Test specific logo URLs mentioned in the request
    test_urls = [
        "/uploads/logos/74a7e52e-87e5-43d2-a6f7-b77ad366458e.png",
        "/uploads/logos/3a5c004b-b161-4b5c-b77d-fce391e8f180.png"
    ]
    
    # Add logo URLs from actual academy data
    for academy in academies_with_logos:
        logo_url = academy.get('logo_url')
        if logo_url and logo_url not in test_urls:
            test_urls.append(logo_url)
    
    print(f"Testing {len(test_urls)} logo URLs:")
    
    accessible_logos = []
    inaccessible_logos = []
    
    for logo_url in test_urls:
        try:
            full_url = f"{BACKEND_URL}{logo_url}"
            print(f"\n🔗 Testing: {full_url}")
            
            response = requests.get(full_url, timeout=10)
            print(f"  Status Code: {response.status_code}")
            print(f"  Content-Type: {response.headers.get('content-type', 'N/A')}")
            print(f"  Content-Length: {response.headers.get('content-length', 'N/A')} bytes")
            
            if response.status_code == 200:
                content_type = response.headers.get('content-type', '')
                if content_type.startswith('image/'):
                    print(f"  ✅ Logo accessible and is valid image")
                    accessible_logos.append(logo_url)
                else:
                    print(f"  ⚠️ Logo accessible but content-type is not image: {content_type}")
                    accessible_logos.append(logo_url)
            else:
                print(f"  ❌ Logo not accessible: {response.status_code}")
                inaccessible_logos.append(logo_url)
                
        except Exception as e:
            print(f"  ❌ Error accessing logo: {e}")
            inaccessible_logos.append(logo_url)
    
    print(f"\n📈 Static File Serving Summary:")
    print(f"  - Accessible logos: {len(accessible_logos)}")
    print(f"  - Inaccessible logos: {len(inaccessible_logos)}")
    
    if accessible_logos:
        print("✅ TEST 2 PASSED: Some logos are accessible via static file serving")
    else:
        print("❌ TEST 2 FAILED: No logos are accessible via static file serving")
    
    return accessible_logos, inaccessible_logos

def test_logo_url_format_consistency():
    """Test 3: Test Logo URL Format Consistency"""
    print("\n=== TEST 3: Logo URL Format and File System Check ===")
    
    try:
        # Check if uploads directory exists
        uploads_dir = "/app/backend/uploads/logos"
        print(f"Checking uploads directory: {uploads_dir}")
        
        if os.path.exists(uploads_dir):
            print("✅ Uploads directory exists")
            
            # List files in uploads directory
            files = os.listdir(uploads_dir)
            print(f"Files in uploads directory: {len(files)}")
            
            if files:
                print("📁 Files found:")
                for file in files[:10]:  # Show first 10 files
                    file_path = os.path.join(uploads_dir, file)
                    file_size = os.path.getsize(file_path)
                    print(f"  - {file} ({file_size} bytes)")
                
                if len(files) > 10:
                    print(f"  ... and {len(files) - 10} more files")
                
                print("✅ TEST 3 PASSED: Logo files exist in file system")
                return files
            else:
                print("⚠️ TEST 3 WARNING: Uploads directory is empty")
                return []
        else:
            print("❌ TEST 3 FAILED: Uploads directory does not exist")
            return []
            
    except Exception as e:
        print(f"❌ TEST 3 ERROR: {e}")
        return []

def test_logo_upload_functionality(token):
    """Test 4: Test Academy Logo Upload"""
    print("\n=== TEST 4: Academy Logo Upload Functionality ===")
    
    try:
        # Create a simple test image (1x1 pixel PNG)
        import io
        from PIL import Image
        
        # Create a small test image
        img = Image.new('RGB', (100, 100), color='red')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes.seek(0)
        
        headers = {"Authorization": f"Bearer {token}"}
        files = {"file": ("test_logo.png", img_bytes, "image/png")}
        
        print("🔄 Testing logo upload endpoint...")
        response = requests.post(f"{API_BASE_URL}/upload/logo", headers=headers, files=files, timeout=10)
        
        print(f"Upload Status Code: {response.status_code}")
        print(f"Upload Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            logo_url = data.get('logo_url')
            
            if logo_url:
                print(f"✅ Logo uploaded successfully: {logo_url}")
                
                # Test if uploaded logo is accessible
                full_url = f"{BACKEND_URL}{logo_url}"
                test_response = requests.get(full_url, timeout=10)
                
                if test_response.status_code == 200:
                    print(f"✅ Uploaded logo is accessible at: {full_url}")
                    print("✅ TEST 4 PASSED: Logo upload functionality working")
                    return True
                else:
                    print(f"❌ Uploaded logo not accessible: {test_response.status_code}")
                    return False
            else:
                print("❌ No logo_url in upload response")
                return False
        else:
            print(f"❌ Logo upload failed: {response.text}")
            return False
            
    except ImportError:
        print("⚠️ PIL not available, testing with dummy file...")
        try:
            # Create a dummy file for testing
            dummy_content = b"dummy image content"
            headers = {"Authorization": f"Bearer {token}"}
            files = {"file": ("test_logo.png", dummy_content, "image/png")}
            
            response = requests.post(f"{API_BASE_URL}/upload/logo", headers=headers, files=files, timeout=10)
            print(f"Upload Status Code: {response.status_code}")
            print(f"Upload Response: {response.text}")
            
            if response.status_code == 200:
                print("✅ TEST 4 PASSED: Logo upload endpoint accepts files")
                return True
            else:
                print(f"❌ TEST 4 FAILED: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ TEST 4 ERROR: {e}")
            return False
            
    except Exception as e:
        print(f"❌ TEST 4 ERROR: {e}")
        return False

def main():
    """Main testing function"""
    print("🚀 Starting Academy Logo Issue Testing")
    
    # Get admin token
    token = get_admin_token()
    if not token:
        print("❌ Cannot proceed without admin token")
        return
    
    # Test 1: Check Academy Data Structure
    academies_with_logos = test_academy_data_structure(token)
    
    # Test 2: Test Static File Serving
    accessible_logos, inaccessible_logos = test_static_file_serving(academies_with_logos)
    
    # Test 3: Test Logo URL Format and File System
    files_in_system = test_logo_url_format_consistency()
    
    # Test 4: Test Logo Upload Functionality
    upload_working = test_logo_upload_functionality(token)
    
    # Final Analysis
    print("\n" + "=" * 60)
    print("🔍 ACADEMY LOGO ISSUE ANALYSIS")
    print("=" * 60)
    
    print(f"📊 Data Analysis:")
    print(f"  - Academies with logo_url in database: {len(academies_with_logos)}")
    print(f"  - Logo files accessible via HTTP: {len(accessible_logos)}")
    print(f"  - Logo files inaccessible via HTTP: {len(inaccessible_logos)}")
    print(f"  - Logo files in file system: {len(files_in_system)}")
    print(f"  - Logo upload functionality: {'Working' if upload_working else 'Not Working'}")
    
    # Identify the issue
    if len(academies_with_logos) == 0:
        print("\n🚨 ROOT CAUSE IDENTIFIED: No academies have logo_url values in database")
        print("   SOLUTION: Academies need to upload logos or have logo_url populated")
    elif len(accessible_logos) == 0 and len(academies_with_logos) > 0:
        print("\n🚨 ROOT CAUSE IDENTIFIED: Logo URLs exist in database but files are not accessible")
        print("   SOLUTION: Check static file serving configuration or file permissions")
    elif len(files_in_system) == 0:
        print("\n🚨 ROOT CAUSE IDENTIFIED: No logo files exist in the file system")
        print("   SOLUTION: Logo files need to be uploaded to /app/backend/uploads/logos/")
    elif not upload_working:
        print("\n🚨 ROOT CAUSE IDENTIFIED: Logo upload functionality is not working")
        print("   SOLUTION: Fix the logo upload endpoint")
    else:
        print("\n✅ LOGO SYSTEM APPEARS TO BE WORKING")
        print("   The issue might be in the frontend display logic")
    
    print("\n📋 RECOMMENDATIONS:")
    print("1. Check if academies have uploaded logos via the admin interface")
    print("2. Verify static file serving is properly configured")
    print("3. Ensure logo files exist in /app/backend/uploads/logos/")
    print("4. Test logo upload functionality in the admin dashboard")
    print("5. Check frontend code for logo display logic")

if __name__ == "__main__":
    main()