#!/usr/bin/env node

// Production Deployment Testing Script
// Run with: node test-production.js

const https = require('https');
const http = require('http');

// Configuration - Update these URLs after deployment
const FRONTEND_URL = 'https://trackmyacademy.vercel.app';
const BACKEND_URL = 'https://your-app-backend.onrender.com'; // Update this!

console.log('🚀 Testing Track My Academy Production Deployment\n');

// Test function
function testEndpoint(url, description) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (res) => {
      const statusCode = res.statusCode;
      const success = statusCode >= 200 && statusCode < 300;
      
      console.log(`${success ? '✅' : '❌'} ${description}: ${statusCode} ${res.statusMessage}`);
      
      if (url.includes('/api/health')) {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const healthData = JSON.parse(data);
            console.log(`   📊 Database: ${healthData.database}`);
            console.log(`   🌍 Environment: ${healthData.environment}`);
            console.log(`   📅 Timestamp: ${healthData.timestamp}\n`);
          } catch (e) {
            console.log(`   ⚠️  Could not parse health data\n`);
          }
        });
      }
      
      resolve({ success, statusCode });
    }).on('error', (err) => {
      console.log(`❌ ${description}: Connection failed - ${err.message}`);
      resolve({ success: false, error: err.message });
    });
  });
}

// Run tests
async function runTests() {
  console.log('🔍 Running Production Tests...\n');
  
  // Test backend health
  await testEndpoint(`${BACKEND_URL}/api/health`, 'Backend Health Check');
  
  // Test frontend
  await testEndpoint(FRONTEND_URL, 'Frontend Landing Page');
  
  // Test API endpoints
  await testEndpoint(`${BACKEND_URL}/api/create-super-admin`, 'Super Admin Creation');
  
  console.log('\n📋 Manual Tests Required:');
  console.log('1. Visit frontend URL and verify landing page loads');
  console.log('2. Test user signup/signin functionality');
  console.log('3. Verify dashboard access with different roles');
  console.log('4. Check browser console for CORS errors');
  
  console.log('\n🎯 URLs to Test:');
  console.log(`Frontend: ${FRONTEND_URL}`);
  console.log(`Backend Health: ${BACKEND_URL}/api/health`);
  console.log(`API Docs: ${BACKEND_URL}/docs (if development mode)`);
  
  console.log('\n✨ Deployment Test Complete!');
  
  if (BACKEND_URL.includes('your-app-backend')) {
    console.log('\n⚠️  REMINDER: Update BACKEND_URL in this script with your actual Render URL');
  }
}

runTests().catch(console.error);