# Change Log

All notable changes to the Student Management System will be documented in this file.

## [Unreleased] - Recent Updates

### Security & Bug Fixes
- **Token Revocation Gap Fixed**: Access tokens now include a `tokenVersion` which is validated against the database in the `protect` middleware, ensuring revoked tokens are invalidated immediately.
- **In-Memory Token Storage**: Moved the JWT Access Token out of `localStorage` and into an in-memory JS variable, significantly reducing the risk of XSS attacks. The app now relies on the `httpOnly` Refresh Cookie to retrieve it seamlessly on page load.
- **Faculty Mark Entry Authorization**: Added validation in `markController.js` to prevent faculty from modifying marks for subjects they are not actively assigned to.
- **CORS Config**: Replaced hardcoded `http://localhost:5173` with `process.env.CLIENT_URL` in `server.js` for production safety.
- **RS256 Keys**: Refactored the JWT key loading mechanism to read keys natively from `keys.json`, avoiding fragile string-replace hacks via environment variables.
- **Login Rate Limiting**: Added a stricter 5-requests-per-15-minutes rate limit specifically to the `/api/auth/login` route to prevent brute-force attempts.

### Testing Best Practices Added
- **Test Database**: Added `docker-compose.test.yml` for spinning up a temporary PostgreSQL instance for E2E testing.
- **Integration Tests**: Added `auth.integration.test.js` using `supertest` for testing the auth flow.
- **Component Tests**: Added `StudentModal.test.jsx` for Vitest and React Testing Library.
- **Visual Regression**: Added `dashboard.spec.js` using Playwright to ensure UI consistency.

### Added
- **Faculty Profile Page (`FacultyProfile.jsx`)**: Added a dedicated profile page for faculty members to view their personal details, department info, and assigned subjects.
- **Dynamic Profile Routing (`Profile.jsx`)**: Created a wrapper component to automatically route `/profile` to either `StudentProfile` or `FacultyProfile` based on the logged-in user's role.
- **Sidebar Updates**: Added a "My Profile" navigation link for Faculty users.

### Changed
- **Course Controller (`courseController.js`)**: 
  - Updated the `/api/courses` endpoint to filter the returned courses, semesters, and subjects based on the assigned subjects for Faculty users, and the assigned semester for Student users.
- **Academic Controller (`academicController.js`)**: 
  - Updated the `/api/academics/*` endpoints so that dropdowns in the Attendance and Marks modules automatically filter the available Courses, Semesters, and Subjects to only those taught by the logged-in Faculty.
- **Faculty Modal (`FacultyModal.jsx`)**: 
  - Improved the subject assignment UI during Faculty registration/editing. The subjects list now dynamically filters based on the selected Department, preventing faculty from being assigned subjects outside their domain.
- **Faculty Controller (`facultyController.js`)**: 
  - Added support for fetching the currently logged-in faculty using the `/api/faculty/me` endpoint.
- **Documentation**: 
  - Updated `README.md` to reflect the new Faculty Management features.
  - Added new prompt suggestions to `prompts.md` for role-based enhancements.

### Fixed
- Fixed an issue where Students could see all subjects across all semesters for their course instead of just their current semester.
- Fixed an issue where Faculty could see and mark attendance for subjects they do not teach.
