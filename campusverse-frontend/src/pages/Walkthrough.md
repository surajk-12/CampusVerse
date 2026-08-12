# Walkthrough - Role-Based Permissions & Platform Redesign

This document outlines the updates, backend middlewares, frontend integration, and the redesigned Homepage & Student Registration flows.

---

## 🔑 Role-Based Access Control (RBAC) System

We implemented a full 4-tier permission matrix across the platform:
1. `super_admin`: Platform owner, global permissions.
2. `college_admin`: Manages one college, appointed by Super Admin.
3. `moderator`: Trusted students who moderate posts, verify notes, and pin Q&A questions.
4. `student`: Standard college student.

### 1. Backend Implementation

- **Database Schemas**:
  - `User.js` role enum expanded: `["super_admin", "college_admin", "moderator", "student"]`.
  - `College.model.js` updated with an `admin` reference field.
  - `Query.model.js`, `Post.model.js`, `Answer.model.js` updated with `reports[]` array for content flagging.
  - `Query.model.js` updated with `isPinned` state.
  - `Resource.model.js` (NotesVerse) updated with `isVerified`, `reports[]`, and `college` fields.
- **Middleware Guards (`authMiddleware.js`)**:
  - `requireRole(roles[])`: Ensures the requesting user possesses one of the allowed roles.
  - `requireCollegeScope`: Restricts college admins and moderators to perform actions only on students, queries, and posts of their *own* college.
  - `requireOwnerOrRole`: Grants access if the user is the original author OR is an admin.
- **API Endpoints**:
  - **Q&A**: Pinned questions sorted first on feed. Toggle Pin: `PUT /queries/:id/pin`. Report: `POST /queries/:id/report` & `POST /queries/answers/:id/report`. Delete Question: `DELETE /queries/:id`. Delete Answer: `DELETE /queries/answers/:answerId`.
  - **Feed Posts**: Report: `POST /feed/:id/report`. Delete: `DELETE /feed/posts/:id` (guarded for owners & moderators).
  - **Resources**: Verify: `PUT /resources/:id/verify`. Report: `POST /resources/:id/report`.
  - **Students**: Verify Toggle: `PUT /users/:userId/verify`. Remove student: `DELETE /users/:userId` (guarded for super_admin & college_admin).

### 2. Frontend Integration

- **Role Hook (`useRole.js`)**:
  - Exposes properties like `isSuperAdmin`, `isCollegeAdmin`, `isModerator`, `isStudent`, `canModerate`, `canAdminister`.
  - Exposes helpers like `sameCollege(collegeId)` and `hasRole(roles[])` for page-level verification.
- **Route Protection (`App.jsx`)**:
  - Gated the `/college-register` route for `super_admin` only.
- **Dynamic Sidebar (`MySidebar.jsx`)**:
  - Automatically renders an "Admin" panel with "Register College" link only for `super_admin` users.
- **Page Moderation Controls**:
  - **Q&A (`QueriesPage.jsx`)**: Added Pin/Unpin pushpin toggle (moderators/admins), Delete action (owners/admins), Report button (peers), and verification solving badge (owners/admins).
  - **Feed (`Feed.jsx`)**: Integrated Post Report flag icon and Post Delete trash bin icon conditionally based on roles.
  - **Academic Notes (`NotesPage.jsx`)**: Added Verify checkmark (moderator+), Delete trash (owner/admin), and Report flag icons to each notes asset card.
  - **Students Directory (`StudentsTable.jsx`)**: Added green check icon next to verified students. Added verify check button and delete student button for college admins / super admins.

---

## 🎨 Homepage & Registration Redesign

We completely overhauled the public entrance views to establish a modern, trust-building SaaS landing experience:

### 1. Navigation updates (`NavBar.jsx`)
- Removed outdated `Home` and `Login` tabs.
- Added smooth anchor scroll buttons pointing to **Features**, **How It Works**, **About**, and **FAQ** sections.
- Unified access path into a primary **Sign In** button redirecting directly to `/login`.
- Clicking the brand logo or typography redirects back to the homepage `/` from any screen.

### 2. Redesigned Homepage (`LandingPage.jsx`)
- **Hero Area:** Bold, premium typography showcasing the new "Campus Operating System" tagline, supporting description, custom glassmorphic active directory dashboard previews, and verified role badge preview card stack.
- **Trusted Statistics:** Key metrics highlighting community growth (active student count, registered universities, and shared assets).
- **Workflow & Process Timeline:** Visual 1-2-3 guide detailing how students find their campus, verify their student IDs, and join sub-verses.
- **Detailed Features Grid:** Re-designed feature cards showcasing Role-Based Access Control, NotesVerse file vault, peer Q&As, local marketplace, events RSVPs, and peer chat connections.
- **Accordions & Testimonials:** Integrated sleek peer reviews ( राहुल, दिव्या, करन ) and clean FAQ accordions answering security and moderation questions.

### 3. Split-Screen Registration Page (`Register.jsx`)
- **SaaS Split Layout:** 
  - **Left Side:** Trust highlights detailing Verified student directories, Role guards, and platform metrics with premium gradient aesthetics.
  - **Right Side:** User-focused form fields.
- **Fields & Controls:** Includes Full Name, Email, Password, Confirm Password, Organization/College fields, and a mandatory Terms & Conditions checkbox.
- **Real-Time Validations:**
  - Password strength progress bar (Weak/Medium/Strong) dynamically evaluated on complexity.
  - Real-time confirmation validation (warns if passwords mismatch).
  - Clean error alert banners and loading states.
  - Form validation: Autocomplete dropdown allows students to select their college dynamically inside the form if they access it without pre-selecting a college from the homepage.

---

## 📹 Verification Demo

The complete user flow from landing page to registration form has been verified using automated browser actions:

![User Flow Verification Recording](C:/Users/SurajKumar/.gemini/antigravity-ide/brain/8acc8541-a25d-4960-94ab-20ae3c6d3137/page_redesign_flow_1786423958067.webp)
