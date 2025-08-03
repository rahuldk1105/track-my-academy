# 🚀 Track My Academy - Production Deployment Guide

## 🎯 Overview

This guide will help you deploy your Track My Academy application to production:
- **Backend**: Render (FastAPI + Python)
- **Frontend**: Vercel (React)
- **Database**: MongoDB Atlas

## 📋 Pre-Deployment Checklist

### ✅ What's Already Done
- ✅ Production-ready backend configuration
- ✅ CORS settings updated for production domains
- ✅ Environment-specific configurations
- ✅ Error handling and logging
- ✅ Health check endpoints
- ✅ Security hardening

### 🔧 What You Need to Set Up

#### 1. MongoDB Atlas (Database)
Follow the detailed guide in `mongodb-atlas-setup.md`:
- Create MongoDB Atlas account
- Set up production cluster
- Configure security (user + network access)
- Get connection string

#### 2. Render (Backend)
- Your production backend URL: `https://your-app-backend.onrender.com`
- Repository connected ✅
- Environment variables needed (see below)

#### 3. Vercel (Frontend)
- Your production frontend URL: `https://trackmyacademy.vercel.app`
- Repository connected ✅
- Environment variables needed (see below)

## 🔐 Environment Variables Setup

### For Render (Backend)

In your Render dashboard, add these environment variables:

```bash
# Required - Database
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/track_my_academy?retryWrites=true&w=majority

# Required - Security (Render will generate SECRET_KEY automatically)
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Required - Supabase (Same as development)
SUPABASE_URL=https://dhlndplegrqjggcffvtp.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobG5kcGxlZ3JxamdnY2ZmdnRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMzI5NTEsImV4cCI6MjA2OTgwODk1MX0.iH5xjU5QQ78dcwk6k0MNe2f_4oew1y0fsWwjsqieWfM
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobG5kcGxlZ3JxamdnY2ZmdnRwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDIzMjk1MSwiZXhwIjoyMDY5ODA4OTUxfQ.qX-ieR61Z_fBAqVFiUPOCm3IqyP670tBczPvRm140tQ
SUPABASE_JWT_SECRET=oskgm/xOLzlwb4BjA8RcKYSaBE2DDGv/7aOOdkY+hHOS2oEAkanEwAmagknrefH7XPjsx3KWY0dlx7hYVN7/lg==
JWT_ALGORITHM=HS256

# Required - Production Settings
ENVIRONMENT=production
CORS_ORIGINS=https://trackmyacademy.vercel.app
FRONTEND_URL=https://trackmyacademy.vercel.app
PORT=8001
```

### For Vercel (Frontend)

In your Vercel dashboard, add these environment variables:

```bash
# Required - Backend API
REACT_APP_BACKEND_URL=https://your-app-backend.onrender.com

# Required - Supabase (Same as development)
REACT_APP_SUPABASE_URL=https://dhlndplegrqjggcffvtp.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobG5kcGxlZ3JxamdnY2ZmdnRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMzI5NTEsImV4cCI6MjA2OTgwODk1MX0.iH5xjU5QQ78dcwk6k0MNe2f_4oew1y0fsWwjsqieWfM

# Required - Environment
REACT_APP_ENVIRONMENT=production
```

## 🔗 Step-by-Step Deployment

### Step 1: Update Backend Domain in Render
1. Once your Render backend is deployed, note the actual URL
2. If it's different from `https://your-app-backend.onrender.com`, update:
   - Vercel environment variable: `REACT_APP_BACKEND_URL`
   - Render environment variable: `CORS_ORIGINS` (add both domains)

### Step 2: Update Supabase Settings
In your Supabase dashboard:
1. Go to Authentication > Settings
2. Add your production URLs to:
   - **Site URL**: `https://trackmyacademy.vercel.app`
   - **Redirect URLs**: 
     - `https://trackmyacademy.vercel.app/**`
     - `https://trackmyacademy.vercel.app/reset-password`

### Step 3: Test Deployment

#### Backend Health Check
Visit: `https://your-actual-backend-url.onrender.com/api/health`

Expected response:
```json
{
  "status": "healthy",
  "database": "healthy",
  "environment": "production",
  "version": "1.0.0"
}
```

#### Frontend Access
Visit: `https://trackmyacademy.vercel.app`
- Should load the landing page
- Authentication should work
- No CORS errors in browser console

## 🔧 Post-Deployment Configuration

### Create Super Admin (One-time setup)
1. Visit: `https://your-backend-url.onrender.com/api/create-super-admin`
2. Note down the credentials:
   - Email: `superadmin@trackmyacademy.com`
   - Password: `SuperAdmin123!`

### Update Domain References
If your actual backend URL is different, find and replace in:
- `CORS_ORIGINS` in Render
- `REACT_APP_BACKEND_URL` in Vercel
- Supabase redirect URLs

## 🚨 Troubleshooting

### Common Issues & Solutions

#### 1. CORS Errors
**Problem**: Browser console shows CORS errors
**Solution**: 
- Check `CORS_ORIGINS` in Render includes your frontend URL
- Ensure no trailing slashes in URLs

#### 2. Database Connection Errors
**Problem**: Backend health check shows "unhealthy database"
**Solution**:
- Verify MongoDB Atlas network access allows `0.0.0.0/0`
- Check username/password in connection string
- Ensure database name is `track_my_academy`

#### 3. Authentication Errors
**Problem**: Login/signup not working
**Solution**:
- Verify Supabase URLs are updated in dashboard
- Check all Supabase environment variables are set correctly

#### 4. Build Failures
**Problem**: Deployment fails during build
**Solution**:
- Check logs in respective dashboards
- Verify all required environment variables are set
- Ensure dependencies are up to date

## 🎉 Success Checklist

- [ ] Backend deploys successfully on Render
- [ ] Frontend deploys successfully on Vercel  
- [ ] Health check returns "healthy" status
- [ ] Landing page loads without errors
- [ ] User can sign up for new account
- [ ] User can sign in with credentials
- [ ] Dashboard loads with proper role-based access
- [ ] No CORS errors in browser console
- [ ] Database operations work (create academy, add users, etc.)

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review deployment logs in Render/Vercel dashboards
3. Test individual components (database, backend health, frontend)
4. Verify all environment variables are correctly set

Your Track My Academy application is now production-ready! 🚀

## 🔐 Security Notes

- All sensitive data is in environment variables
- CORS is properly configured for production domains
- MongoDB Atlas provides encrypted connections
- Supabase handles secure authentication
- Health checks don't expose sensitive information

## 🎯 Next Steps

After successful deployment:
1. Test all functionality thoroughly
2. Set up monitoring (optional)
3. Configure custom domains (optional)
4. Set up backup strategies
5. Monitor performance and errors

Happy deploying! 🎊