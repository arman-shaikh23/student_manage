# Prompts for Further Expansion & Debugging

Here are some useful prompts you can give me to further manage, expand, or debug the Student Management System:

### 1. Database & Schema Changes
- "Add a `Teacher` model to the Prisma schema and create relationships so a Teacher can be assigned to multiple Courses."
- "Add a new `department` field to the Student model and update the frontend and backend to support it."
- "Generate a script to populate the database with 50 fake students, 10 courses, and random attendance/marks data for testing."

### 2. Frontend Features
- "Create a new 'Settings' page where the Admin can update their email and change their password."
- "Enhance the Student Profile page to include a Line Chart showing the student's marks progression over time."
- "Implement a full-screen image preview modal when an admin clicks on a student's profile picture."

### 3. Backend & API
- "Add a 'Forgot Password' flow using Nodemailer to send a password reset link to the admin's email."
- "Implement pagination for the Attendance and Marks API endpoints to handle thousands of records efficiently."
- "Add an endpoint that generates a CSV export of all students instead of PDF, and hook it up to a new 'Export CSV' button on the frontend."

### 4. Deployment & DevOps
- "Write a Dockerfile for the frontend and backend, and update the docker-compose.yml to run the full stack."
- "How do I deploy this application to Vercel (frontend) and Render (backend)?"
- "Set up a GitHub Actions workflow to automatically run ESLint and Prisma checks on push."

### 5. Debugging
- "I'm getting a CORS error when the frontend tries to call the backend. How can I fix this in `server.js`?"
- "The PDF export is cutting off long student names. Can you update `exportPDF.js` to wrap text or adjust column widths?"
- "The `jwt.verify` is throwing a TokenExpiredError. How can I implement a refresh token strategy to keep the user logged in seamlessly?"

### 6. Role-Based Enhancements
- "Add a new 'Head of Department' role that can oversee all faculty and students within their specific department."
- "Implement an 'Admin Profile' page for admins to update their own contact details and system preferences."

### 7. Testing & Quality Assurance
- "How do I run the Vitest and Playwright test suites together in a CI pipeline?"
- "Add an integration test to `marks.test.js` to ensure students can only view their own marks."
