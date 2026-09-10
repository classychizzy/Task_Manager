import apiClient from "./client";
import type { ApiResponse } from "../types/Responsehandler";
import type { LoginData, RegisterPayload, RegisterData } from "../types/auth";

export async function loginRequest(email: string, password: string):
    Promise<ApiResponse<LoginData>> {
    const response = await apiClient.post(`/auth/login`,
        { email, password });
    const data = response.data;
    if (response.status !== 200) throw new Error(data.message || "Login failed");
    return data;
}

export async function registerRequest(payload: RegisterPayload):
    Promise<ApiResponse<RegisterData>> {
    const response = await apiClient.post(`/auth/register`, payload);
    const data = response.data;
    if (response.status !== 200) throw new Error(data.message || "Registration failed");
    return data;
}