// src/routes/index.tsx
import { Route, Routes } from "react-router-dom";
import LoginPage from "../pages/Login";
import RegisterPage from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import ProtectedRoute from "../components/ProtectedRoutes";
import ProjectsPage from "../pages/Project";
import ProjectDetailPage from "../pages/Project";
import TaskDetailPage from "../pages/TaskDetail";
import CommentsPage from "../pages/comment"

export default function AppRoutes() {
    console.log('reading appRoutes')
    return (
        <Routes>
            {/* public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* protected routes */}
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />

            <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
            <Route path="/projects/:projectId" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />
            <Route path="/tasks/:taskId" element={<ProtectedRoute><TaskDetailPage /></ProtectedRoute>} />
            <Route path="/comments" element={<ProtectedRoute><CommentsPage /></ProtectedRoute>} />
        </Routes>
    );
}