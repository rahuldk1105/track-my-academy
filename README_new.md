# Track My Academy 🏃‍♂️

A comprehensive SaaS platform designed for sports academies to manage their entire training ecosystem. This platform connects three main roles: Academy Admins, Coaches, and Students.

## 🎯 Purpose

Track My Academy helps sports academies digitize their student records, assign coaches, monitor training performance, and communicate effectively. The goal is to offer a full-stack web solution that is scalable, modern, and user-friendly.

## 👥 Target Users

- **Academy Admins**: Manage the academy, onboard students and coaches, oversee dashboards
- **Coaches**: View assigned students, track performance, and update training logs  
- **Students** (or their guardians): View progress reports, attendance, and receive announcements

## 🏗️ Tech Stack

- **Frontend**: React 18.2.0 with Tailwind CSS
- **Backend**: FastAPI with Python
- **Database**: MongoDB
- **Authentication**: JWT-based with role-based access control
- **Deployment**: Supervisor for process management

## 📦 Data Models

### Academy
- `academy_id`, `academy_name`, `academy_location`, `academy_logo_url`, `admin_email`

### Coach  
- `coach_id`, `name`, `email`, `specialization`, `profile_pic`, `bio`, `academy_id`

### Student
- `student_id`, `name`, `email`, `age`, `parent_contact`, `enrolled_program`, `performance_score`, `photo`, `academy_id`, `assigned_coaches[]`

### User
- `user_id`, `email`, `role` (admin/coach/student), `name`, `academy_id`, `hashed_password`

## 🔐 Authentication & Authorization

- JWT-based authentication system
- Role-based access control with three roles: `admin`, `coach`, `student`
- Admins can manage all users in their academies
- Coaches can only access their assigned students  
- Students can only view their own data

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 14+
- MongoDB
- Supervisor

### Installation & Setup

1. **Clone and navigate to the project:**
   ```bash
   cd /app
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   yarn install
   ```

4. **Start Services:**
   ```bash
   sudo supervisorctl start all
   ```

5. **Create Demo Data:**
   ```bash
   python scripts/setup_demo_data.py
   ```

### Demo Accounts

After running the setup script, you can log in with these accounts:

- **Admin**: `admin@academy.com` / `password123`
- **Coach**: `coach@academy.com` / `password123`  
- **Student**: `student@academy.com` / `password123`

## 📡 API Endpoints

### Authentication
- `POST /api/token` - Login and get JWT token
- `GET /api/users/me` - Get current user profile

### Academy Management  
- `GET /api/academies` - List academies (role-based access)
- `POST /api/academies` - Create new academy (admin only)
- `GET /api/academies/{academy_id}` - Get academy details

### Coach Management
- `GET /api/coaches` - List coaches (role-based access)
- `POST /api/coaches` - Create new coach (admin only)

### Student Management
- `GET /api/students` - List students (role-based access)
- `POST /api/students` - Create new student (admin only)
- `POST /api/students/{student_id}/assign-coach/{coach_id}` - Assign coach to student

### Health Check
- `GET /api/health` - API health status

## 🎨 Frontend Features

### Admin Dashboard
- Academy overview with stats
- Quick actions to create coaches and students
- Management interfaces for all entities
- Role-based data visualization

### Coach Dashboard  
- View assigned students
- Track student performance scores
- Student contact information and programs

### Student Dashboard
- Personal profile and progress
- View assigned coaches
- Performance tracking
- Visual progress indicators

## 🔧 Development

### Backend Development
```bash
cd backend
python server.py  # Development server
```

### Frontend Development
```bash  
cd frontend
yarn start  # Development server with hot reload
```

### Services Management
```bash
sudo supervisorctl status    # Check service status
sudo supervisorctl restart all  # Restart all services
sudo supervisorctl stop backend  # Stop specific service
```

## 📊 Database Schema

The application uses MongoDB with the following collections:

- `users` - User authentication and profiles
- `academies` - Academy information  
- `coaches` - Coach profiles and specializations
- `students` - Student profiles and performance data

All entities use UUID-based primary keys for better scalability and JSON compatibility.

## 🛠️ Project Structure

```
/app/
├── backend/              # FastAPI backend
│   ├── server.py        # Main application
│   ├── requirements.txt # Python dependencies
│   └── .env            # Environment variables
├── frontend/            # React frontend  
│   ├── src/
│   │   ├── App.js      # Main React component
│   │   ├── App.css     # Component styles
│   │   └── index.js    # Entry point
│   ├── package.json    # Node dependencies
│   └── .env           # Frontend environment variables
├── scripts/            # Utility scripts
│   └── setup_demo_data.py  # Demo data creation
└── README.md          # Project documentation
```

## 🔮 Future Enhancements

- Performance analytics and charts
- Real-time messaging system
- Attendance tracking
- Progress reports generation
- Mobile app support
- Advanced role permissions
- Integration with external fitness devices

## 🐛 Troubleshooting

### Common Issues

1. **Services not starting**: Check supervisor logs
   ```bash
   tail -f /var/log/supervisor/backend.err.log
   ```

2. **Database connection issues**: Verify MongoDB is running
   ```bash
   sudo supervisorctl status mongodb
   ```

3. **Frontend build errors**: Clear cache and reinstall
   ```bash
   cd frontend && rm -rf node_modules && yarn install
   ```

## 📝 API Testing

Test the API using curl:

```bash
# Login
TOKEN=$(curl -s -X POST -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@academy.com&password=password123" \
  http://localhost:8001/api/token | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

# Get students (with auth)
curl -H "Authorization: Bearer $TOKEN" http://localhost:8001/api/students
```

## 🤝 Contributing

This is an MVP implementation. Future contributions should focus on:

- Enhanced UI/UX improvements
- Performance optimization
- Additional sports-specific features
- Mobile responsiveness
- Automated testing suite

---

**Track My Academy** - Empowering sports academies with digital transformation 🏆