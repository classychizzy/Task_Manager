# Task Manager Frontend Documentation

Welcome to the documentation for the **Task Manager Frontend** application. This project is a modern, single-page web application (SPA) built with **React 19**, **TypeScript**, and **Vite**.

---

## 📐 Architecture & Technology Stack

- **Core Library:** React `^19.2.8`
- **Language:** TypeScript `~6.0.2`
- **Build Tool & Bundler:** Vite `^8.2.2` (with Babel React Compiler plugin)
- **Routing:** React Router DOM `^7.18.3`
- **HTTP Client:** Axios `^1.20.0`
- **Styling:** Modular Vanilla CSS per component/page

---

## 📁 Directory & File Structure

```text
frontend/task-manager-frontend/
├── public/                    # Static assets
├── src/
│   ├── api/                   # API client and HTTP request modules
│   │   ├── client.ts          # Axios instance with refresh token interceptor
│   │   ├── auth.ts            # Authentication requests (login, register)
│   │   ├── project.ts         # Project endpoints (fetch all, create)
│   │   ├── task.ts            # Task endpoints (fetch tasks, task details)
│   │   ├── comment.ts         # Comment endpoints
│   │   └── testapi.ts         # Backend connectivity health test helper
│   ├── components/            # Reusable UI & wrapper components
│   │   └── ProtectedRoutes.tsx# Route guard restricting unauthenticated access
│   ├── context/               # Global state contexts
│   │   └── authContext.tsx    # Auth state manager (user state, login/register/logout handlers)
│   ├── pages/                 # Top-level view components & styles
│   │   ├── Login.tsx          # Login page view with password toggle
│   │   ├── LoginPage.css      # Styling for Login view
│   │   ├── Register.tsx       # Registration page view
│   │   ├── RegisterPage.css   # Styling for Register view
│   │   ├── Dashboard.tsx      # Core dashboard with search & task Kanban/list view
│   │   ├── Dashboard.css      # Styling for Dashboard view
│   │   ├── Project.tsx        # Projects list grid view
│   │   ├── ProjectsPage.css   # Styling for Projects grid view
│   │   ├── CreateProject.tsx  # Create new project form view
│   │   ├── CreateProjectpage.css # Styling for Create Project view
│   │   ├── TaskDetail.tsx     # Task detail view placeholder
│   │   └── Comment.tsx        # Comments page view placeholder
│   ├── routes/
│   │   └── index.tsx          # Application routing definitions & page mapping
│   ├── types/                 # TypeScript type definitions and interfaces
│   │   ├── auth.ts            # User, LoginData, RegisterPayload interfaces
│   │   ├── project.ts         # Project, ProjectUser, PaginationMeta interfaces
│   │   ├── task.ts            # Task model interfaces
│   │   ├── comment.ts         # Comment model interfaces
│   │   └── Responsehandler.ts # Generic ApiResponse wrapper interface
│   ├── App.tsx                # Root App component wrapped with BrowserRouter
│   ├── App.css                # Base App styles
│   ├── main.tsx               # Application entry point with AuthProvider
│   └── index.css              # Global CSS reset & theme variables
├── .env                       # Environment variables (VITE_API_URL)
├── package.json               # NPM scripts and dependency definitions
├── tsconfig.json              # TypeScript configuration reference
└── vite.config.ts             # Vite configuration with React Compiler plugin
```

---

## 🔑 Core Architecture Details

### 1. Authentication & Session Management
- **`AuthContext` (`src/context/authContext.tsx`)**:
  - Provides `user`, `login()`, `register()`, and `logout()` to all components via the `useAuth()` hook.
  - User session state is persisted in `localStorage`.
- **`ProtectedRoute` (`src/components/ProtectedRoutes.tsx`)**:
  - Checks `user` status from `useAuth()`.
  - Redirects unauthenticated users to `/login` with `replace` history modifier.

### 2. HTTP Client & Token Refresh Flow (`src/api/client.ts`)
- Axios instance configured with `baseURL` set from `import.meta.env.VITE_API_URL` and `withCredentials: true`.
- **Response Interceptor**:
  - Catches `401` / `403` HTTP errors.
  - Implements a retry queue mechanism to avoid duplicate token refreshes when multiple concurrent API requests fail.
  - Issues `/auth/refresh` request automatically.
  - If token renewal fails, clears queue and redirects user to `/login`.

### 3. Application Routing (`src/routes/index.tsx`)

| Path | Element | Protection | Description |
| :--- | :--- | :--- | :--- |
| `/login` | `<LoginPage />` | Public | User login page |
| `/register` | `<RegisterPage />` | Public | User registration page |
| `/` | `<Dashboard />` | Protected | Main dashboard with search and task categories |
| `/projects` | `<ProjectsPage />` | Protected | Grid list of active projects |
| `/projects/new` | `<CreateProjectPage />` | Protected | Form to create a new project |
| `/projects/:projectId` | `<ProjectDetailPage />` | Protected | Project specific details view |
| `/tasks/:taskId` | `<TaskDetailPage />` | Protected | Individual task view |
| `/comments` | `<CommentsPage />` | Protected | Task comments overview |

---

## 🛠 Type System (`src/types/`)

- **`ApiResponse<T>`**: Standard response contract matching backend payload structure (`status_code`, `status`, `message`, `data`).
- **`User` / `LoginData` / `RegisterPayload`**: Authentication interfaces.
- **`Project` / `createProject` / `PaginationMeta`**: Project entities & pagination metadata.
- **`Task`**: Task object model with status fields (`"todo" | "progress" | "done"`).
- **`Comment`**: Comment model for task discussions.

---

## 🚀 Running & Developing Locally

### Prerequisites
- Node.js (v18+ recommended)
- Configured `.env` file in `frontend/task-manager-frontend/`:
  ```env
  VITE_API_URL=http://localhost:9000/api/v1
  ```

### Development Commands

Run commands from the `frontend/task-manager-frontend` directory:

```bash
# Start development server with HMR
npm run dev

# Type-check and build for production
npm run build

# Preview production build locally
npm run preview

# Run ESLint check
npm run lint
```

---

## 📌 Summary of Features
- 🔐 **Authentication**: User Registration, Login, Token Refresh handling, Session Persistence.
- 📊 **Dashboard**: Task listing by status section, search filter, header navigation buttons.
- 📁 **Project Management**: Fetching project list with API integration, creating new projects with validation.
- 🛡️ **Route Protection**: Instant redirection for unauthenticated access.
