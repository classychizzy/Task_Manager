import apiClient from "./client";
import type { ApiResponse } from "../types/Responsehandler";
import type { LoginData } from "../types/auth";

export async function loginRequest(email: string, password: string):
    Promise<ApiResponse<LoginData>> {
    const response = await apiClient.post(`/auth/login`,
        { email, password });
    const data = response.data;
    if (response.status !== 200) throw new Error(data.message || "Login failed");
    return data;
}