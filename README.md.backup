You are building a SaaS platform called “Track My Academy,” designed for sports academies to manage their entire training ecosystem. This platform connects three main roles: Academy Admins, Coaches, and Students.

🎯 Purpose:
Track My Academy helps sports academies digitize their student records, assign coaches, monitor training performance, and communicate effectively. The goal is to offer a full-stack web solution that is scalable, modern, and user-friendly — starting with the MVP.

👥 Target Users:
- **Academy Admins**: Manage the academy, onboard students and coaches, oversee dashboards.
- **Coaches**: View assigned students, track performance, and update training logs.
- **Students** (or their guardians): View progress reports, attendance, and receive announcements.

📦 Entities and Relationships:
1. **Academy**:
   - Can have multiple Coaches and Students.
   - Fields: `academy_name`, `academy_location`, `academy_logo_url`, `admin_email`.

2. **Coach**:
   - Belongs to one Academy.
   - Can be assigned to multiple Students.
   - Fields: `coach_id`, `name`, `email`, `specialization`, `profile_pic`, `bio`.

3. **Student**:
   - Belongs to one Academy.
   - Can be assigned to one or more Coaches.
   - Fields: `student_id`, `name`, `email`, `age`, `parent_contact`, `enrolled_program`, `performance_score`, `photo`.

🔐 Authentication + Roles:
- Use Supabase authentication with role-based access control.
- Roles: `admin`, `coach`, `student`.
- Admins can manage all users in their Academy.
- Coaches can only access their assigned students.
- Students can only view their own data.

🧱 Deliverables Expected:
- Define database schema and entity relationships (PostgreSQL or Supabase-based).
- Outline auth logic and access rules.
- Prepare API endpoints or data actions to fetch: 
  - Academy-wise list of students/coaches
  - Coach-wise student mapping
  - Student performance summary per coach

📌 Note:
- This is just the foundation. We will later add dashboards, charts, login flows, and landing pages.
