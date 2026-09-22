# Task Manager Frontend

A modern, responsive Task Management application built with **React 19**, **TypeScript**, **Vite**, **React Router v7**, and **Axios**.

> For detailed architectural documentation, module descriptions, and API contracts, please refer to [DOCUMENTATION.md](file:///Users/classychizzy/Task_Manager/frontend/task-manager-frontend/DOCUMENTATION.md).

---

## ⚡ Quick Start

### 1. Environment Setup
Create a `.env` file in the `task-manager-frontend` root directory:

```env
VITE_API_URL=http://localhost:9000/api/v1
```

### 2. Available Scripts

```bash
# Start Vite development server
npm run dev

# Run TypeScript compilation and build production output
npm run build

# Preview production build locally
npm run preview

# Run ESLint to verify code quality
npm run lint
```

---

## 📂 Project Structure Overview

```text
src/
├── api/          # Axios HTTP client, refresh token queue interceptor, endpoint functions
├── components/   # Route guards (ProtectedRoute) and shared components
├── context/      # AuthContext for state management & local storage session persistence
├── pages/        # Login, Register, Dashboard, Project, CreateProject views & CSS modules
├── routes/       # Centralized route definitions using React Router DOM
└── types/        # TypeScript models for User, Project, Task, Comment, and API responses
```
