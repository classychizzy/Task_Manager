// src/routes/index.tsx
import { Route, Routes } from "react-router-dom";

import LoginPage from "../pages/Login";
import RegisterPage from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import ProtectedRoute from "../components/ProtectedRoutes";
import ProjectsPage from "../pages/Project";
import CreateProjectPage from "../pages/CreateProject"
// import ProjectDetailPage from "../pages/Project";
// import TaskDetailPage from "../pages/TaskDetail";
// import CommentsPage from "../pages/comment"
import ProfilePage from "../pages/ProfilePage";
import ChangePasswordPage from "../pages/ChangePasswordpage";
import DeleteAccountPage from "../pages/DeleteAccountpage";
import Layout from "../components/Layout";
import TasksPage from "../pages/TaskPage";
import CreateTaskPage from "../pages/CreateTasksPage";
import CalendarPage from "../pages/CalendarPage";

export default function AppRoutes() {
    console.log('reading appRoutes')
    return (
        <Routes>
            {/* public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />


            {/* Protected routes — all share Layout's header/nav */}
            <Route
                element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }
            >

                <Route path="/" element={<Dashboard />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/new" element={<CreateProjectPage />} />
                <Route path="/settings/profile" element={<ProfilePage />} />
                <Route path="/settings/change-password" element={<ChangePasswordPage />} />
                <Route path="/settings/delete-account" element={<DeleteAccountPage />} />
                <Route path="/calendar" element={<CalendarPage />} />

                <Route path="/projects/:projectId/tasks" element={<TasksPage />} />
                <Route path="/projects/:projectId/tasks/new" element={<CreateTaskPage />} />
            </Route>

            <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />

            {/* <Route path="/comments" element={<ProtectedRoute><CommentsPage /></ProtectedRoute>} /> */}





        </Routes>
    );
}