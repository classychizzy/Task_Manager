import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { loginRequest, registerRequest } from "../api/auth";
import { isAxiosError } from "axios";
import type { RegisterPayload, User } from "../types/auth";

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    register: (payload: RegisterPayload) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    console.log('reading authcontext...')
    const [user, setUser] = useState<User | null>(() => {
        const stored = localStorage.getItem("user");
        return stored ? JSON.parse(stored) : null;
    });

    async function register(payload: RegisterPayload) {
        try {
            const response = await registerRequest(payload);
            const { user } = response.data;
            localStorage.setItem("user", JSON.stringify(user));
            setUser(user);
        } catch (err) {
            if (isAxiosError(err) && err.response?.data?.message) {
                throw new Error(err.response.data.message);
            }
            throw new Error("Something went wrong");
        }
    }
    async function login(email: string, password: string) {
        console.log('login auth context')
        const response = await loginRequest(email, password);
        const { accessToken, refreshToken, user } = response.data;

        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("user", JSON.stringify(user));
        setUser(user);
    }

    function logout() {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, register, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}