//reads from authcontext to determine if user is logged in and renders dashboard
import { useAuth } from "../context/authContext";
import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}