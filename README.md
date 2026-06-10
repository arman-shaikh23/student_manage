# Student Management System

A production-ready, full-stack Student Management System featuring a modern SaaS dashboard UI with Glassmorphism design, built using React, Node.js, Express, PostgreSQL, and Prisma ORM.

## Features

- **Secure Authentication**: JWT-based login with bcrypt password hashing.
- **Admin Dashboard**: Analytics dashboard with Recharts (Student growth, Attendance trends, Course enrollments).
- **Student Management**: Full CRUD, pagination, debounced global search, profile image uploads, and dedicated profile pages.
- **Faculty Management**: Faculty profiles, assigned subjects filtering, and role-based access to attendance and courses.
- **Course Management**: Create, edit, delete, and view academic courses.
- **Attendance Tracking**: Mark and track daily attendance with bulk operations, dynamically filtered by faculty subjects.
- **Marks & Grading**: Manage exam scores with automatic grade and percentage calculation.
- **Export to PDF**: Generate and download professional PDF reports for Students, Attendance, and Marks using jsPDF.
- **Modern UI**: Fully responsive, dark/light mode toggle, Framer Motion animations, loading skeletons, and interactive glassmorphic cards.

## Tech Stack

### Frontend
- **React 19** (Vite)
- **Tailwind CSS v4** (Glassmorphism & Theming)
- **Framer Motion** (Animations)
- **React Router v7**
- **Axios** (API Calls & Interceptors)
- **Recharts** (Data Visualization)
- **React Hot Toast** (Notifications)
- **jsPDF & jsPDF-AutoTable** (PDF Generation)
- **Vitest & Playwright** (Component and Visual Testing)

### Backend
- **Node.js & Express**
- **PostgreSQL**
- **Prisma ORM**
- **JWT & bcrypt** (Security)
- **Multer** (File Uploads)
- **Express Validator** (Input validation)
- **Helmet, CORS, express-rate-limit** (API Security)
- **Supertest** (API Integration Testing)

## Security Features
- **In-Memory JWT Storage**: Access tokens are kept in JavaScript memory, mitigating XSS risks, while long-lived refresh tokens are stored in `httpOnly` secure cookies.
- **Strict Token Revocation**: JWT token versions are validated directly against the database on each request to prevent revoked tokens from being reused.
- **Secure RS256 Key Loading**: Private/Public keys are loaded via a secure JSON module instead of inline environment strings.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL installed and running (or use the provided `docker-compose.yml`)

### 1. Database Setup
If you have Docker installed, you can easily spin up a PostgreSQL instance:
```bash
docker-compose up -d
```
Alternatively, create a database manually in pgAdmin or your terminal:
```sql
CREATE DATABASE sms_db;
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Configure your environment variables:
Create `.env` based on `.env.example`:
```env
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sms_db?schema=public"
JWT_SECRET="supersecretjwtkeythatshouldbechangedinproduction"
JWT_EXPIRES_IN="7d"
```

Push the Prisma Schema to the database and generate the client:
```bash
npx prisma db push
npx prisma generate
```

Seed the database with the default Admin user:
```bash
npm run prisma:seed
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

Start the frontend server:
```bash
npm run dev
```

### 4. Access the Application
Open your browser and navigate to `http://localhost:5173`.
Login with the default admin credentials:
- **Email**: `admin@system.com`
- **Password**: `admin123`

## Directory Structure
- `/backend`: Contains the Express API, Prisma schema, controllers, and middlewares.
- `/frontend`: Contains the React Vite application, components, pages, and Tailwind configurations.
- `prompts.md`: Contains useful prompts for further interaction and expansion of the project.
