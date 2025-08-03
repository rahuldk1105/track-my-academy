# 🔐 Super Admin Setup Guide

## Overview

The Super Admin is the highest level user in Track My Academy with full control over all academies and platform settings. This guide shows you how to set up and use the Super Admin functionality.

## 🚀 Quick Setup (Development)

### Method 1: Use the Setup Page (Recommended)
1. Start your development server: `cd frontend && yarn start`
2. Visit: `http://localhost:3000/setup-super-admin`
3. Click "Create Super Admin" 
4. Note down the credentials provided
5. Go to login page and sign in

### Method 2: Direct API Call
1. Start your backend server
2. Visit: `http://localhost:8001/api/create-super-admin`
3. Note the credentials returned
4. Use the credentials to log in

## 🌐 Production Setup

### Step 1: Deploy Your Application
Follow the main deployment guide first to get your app running on Render + Vercel.

### Step 2: Create Super Admin
1. Visit: `https://trackmyacademy.vercel.app/setup-super-admin`
2. Click "Create Super Admin"
3. **Important**: Save the credentials securely!

### Step 3: First Login
1. Go to: `https://trackmyacademy.vercel.app/login`
2. Use the super admin credentials:
   - Email: `superadmin@trackmyacademy.com`
   - Password: `SuperAdmin123!`

### Step 4: Change Password (Security)
1. After logging in, go to Supabase dashboard
2. Update the super admin password
3. Or implement password change feature in the app

## 🔧 Super Admin Capabilities

### Academy Management
- ✅ **Create Academies**: Full academy creation with all details
- ✅ **View All Academies**: See every academy on the platform
- ✅ **Edit Academy Details**: Modify subscription, limits, contact info
- ✅ **Delete Academies**: Remove academies and all related data
- ✅ **Academy Status**: Monitor active/expired/expiring subscriptions
- ✅ **Upload Logos**: Manage academy branding assets

### Platform Analytics
- ✅ **Academy Overview**: Total academies, active users, subscription status
- ✅ **Usage Statistics**: Platform-wide usage metrics
- ✅ **Revenue Tracking**: Subscription and billing overview

### User Management
- ✅ **Platform Users**: See all users across all academies
- ✅ **Role Management**: Manage user roles and permissions
- ✅ **Account Status**: Enable/disable user accounts

### System Administration
- ✅ **Health Monitoring**: System health and database status
- ✅ **Configuration**: Platform-wide settings
- ✅ **Maintenance**: System maintenance tasks

## 🎯 Super Admin Dashboard Features

### Academy Table View
- **Clean Professional Design**: Modern table with all academy details
- **Status Indicators**: Visual status badges (Active, Expired, Expiring Soon)
- **Search & Filter**: Find academies quickly
- **Bulk Actions**: Manage multiple academies at once

### Academy Creation Form
- **Complete Form**: All required academy fields
- **Logo Upload**: Drag-and-drop logo upload
- **Date Pickers**: Subscription start/end date selection
- **Branch Management**: Multiple branch locations
- **Validation**: Real-time form validation

### Dashboard Analytics
- **Quick Stats Cards**: Key metrics at a glance
- **Charts**: Visual representation of platform data
- **Export Options**: Data export capabilities
- **Real-time Updates**: Live data updates

## 🔑 Default Credentials

**Development & Production Default:**
- **Email**: `superadmin@trackmyacademy.com`
- **Password**: `SuperAdmin123!`

⚠️ **Security Warning**: Change the default password immediately after first login!

## 🛡️ Security Features

### Authentication
- ✅ **Supabase Integration**: Secure JWT-based authentication
- ✅ **Role-based Access**: Super admin role enforcement
- ✅ **Session Management**: Automatic token refresh
- ✅ **API Protection**: All super admin endpoints protected

### Authorization
- ✅ **Endpoint Protection**: Only super admins can access admin APIs
- ✅ **Frontend Guards**: UI elements hidden from non-super-admins
- ✅ **Database Security**: MongoDB access with proper permissions

## 🧪 Testing Super Admin Functionality

### Development Testing
```bash
# 1. Create super admin
curl -X POST http://localhost:8001/api/create-super-admin

# 2. Test health check
curl http://localhost:8001/api/health

# 3. Test academy listing (requires auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8001/api/super-admin/academies
```

### Production Testing
1. Visit setup page: `https://trackmyacademy.vercel.app/setup-super-admin`
2. Create super admin account
3. Login and access dashboard
4. Test academy creation/management
5. Verify all functionality works

## 🔄 Troubleshooting

### Issue: "Super admin already exists"
**Solution**: Super admin was already created. Use existing credentials or check database.

### Issue: Authentication errors
**Solution**: 
1. Check Supabase configuration
2. Verify JWT tokens
3. Clear browser localStorage and try again

### Issue: Dashboard not loading
**Solution**:
1. Check browser console for errors
2. Verify API endpoints are accessible
3. Confirm user role is "super_admin"

### Issue: Academy creation fails
**Solution**:
1. Check form validation
2. Verify all required fields
3. Check database connection
4. Review server logs

## 📋 Post-Setup Checklist

- [ ] Super admin account created successfully
- [ ] Can login with super admin credentials
- [ ] Dashboard loads correctly
- [ ] Can create new academy
- [ ] Can view all academies
- [ ] Can edit academy details
- [ ] Can delete academy (test with dummy data)
- [ ] Academy status calculations work
- [ ] Logo upload functionality works
- [ ] All API endpoints respond correctly

## 🚀 Next Steps After Setup

1. **Create Test Academy**: Create a sample academy to test functionality
2. **Add Regular Admin**: Create academy admin users
3. **Test User Roles**: Verify role-based access works correctly
4. **Monitor Health**: Set up monitoring for the health endpoint
5. **Backup Strategy**: Implement database backup procedures
6. **Security Audit**: Review and harden security settings

## 📞 Support

If you encounter issues with Super Admin setup:

1. **Check Logs**: Review browser console and server logs
2. **Verify Environment**: Ensure all environment variables are set
3. **Database Connection**: Confirm MongoDB Atlas connection
4. **Supabase Config**: Verify Supabase authentication settings

Your Super Admin system is now ready to manage the entire Track My Academy platform! 🎉

---

**Quick Access Links:**
- Development Setup: `http://localhost:3000/setup-super-admin`
- Production Setup: `https://trackmyacademy.vercel.app/setup-super-admin`
- Login: `https://trackmyacademy.vercel.app/login`
- Health Check: `https://your-backend.onrender.com/api/health`