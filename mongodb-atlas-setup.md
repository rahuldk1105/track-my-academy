# MongoDB Atlas Production Setup Guide

## 📋 Quick Setup Instructions

### 1. Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account or log in
3. Create a new project called "Track My Academy"

### 2. Create Production Database
1. Click "Build a Database"
2. Choose **FREE** tier (M0 Sandbox)
3. Select your preferred cloud provider and region
4. Name your cluster: `track-my-academy-prod`

### 3. Configure Database Security
1. **Database User**:
   - Username: `track-my-academy-user`
   - Password: Generate a secure password (save it!)
   - Database User Privileges: "Read and write to any database"

2. **Network Access**:
   - Add IP Address: `0.0.0.0/0` (Allow access from anywhere)
   - Description: "Production Access"

### 4. Get Connection String
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Driver: **Python**, Version: **3.6 or later**
4. Copy the connection string (looks like this):
   ```
   mongodb+srv://track-my-academy-user:<password>@track-my-academy-prod.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### 5. Update Connection String
Replace `<password>` with your actual database user password:
```
mongodb+srv://track-my-academy-user:YOUR_ACTUAL_PASSWORD@track-my-academy-prod.xxxxx.mongodb.net/track_my_academy?retryWrites=true&w=majority
```

## 🔧 Configuration for Render

Copy your final MongoDB connection string and use it as the `MONGO_URL` environment variable in Render.

## ✅ Test Connection

Once deployed, visit your backend health endpoint:
```
https://your-app-backend.onrender.com/api/health
```

You should see:
```json
{
  "status": "healthy",
  "database": "healthy",
  "environment": "production"
}
```

## 🔒 Security Best Practices

1. **Never commit database credentials to code**
2. **Use environment variables only**
3. **Enable MongoDB Atlas monitoring**
4. **Set up database backups (automatic in Atlas)**
5. **Monitor connection limits (500 for free tier)**

## 💡 Important Notes

- Free tier includes **512 MB storage**
- **500 connections maximum**
- **No commercial license required** for small applications
- Automatic backups and monitoring included
- Can upgrade to paid tiers anytime for more resources

## 🚨 Troubleshooting

If you see database connection errors:

1. **Check Network Access**: Ensure `0.0.0.0/0` is added
2. **Verify Credentials**: Double-check username/password
3. **Connection String Format**: Make sure it includes `/track_my_academy` at the end
4. **Render Logs**: Check Render deployment logs for specific error messages

Your MongoDB Atlas database is now ready for production! 🚀