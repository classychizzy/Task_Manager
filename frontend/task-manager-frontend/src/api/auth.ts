import apiClient from "./client";
import type { ApiResponse } from "../types/Responsehandler";
import type { LoginData, RegisterPayload, RegisterData, User, UpdateUserPayload, ChangePasswordPayload } from "../types/auth";

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
    if (response.status !== 201) throw new Error(data.message || "Registration failed");
    return data;
}


export async function updateUser(payload: UpdateUserPayload): Promise<ApiResponse<User>> {
    const { data } = await apiClient.put<ApiResponse<User>>(
        "/auth/users/update/me",
        payload
    );
    return data;
}

export async function changePassword(payload: ChangePasswordPayload): Promise<ApiResponse<null>> {
    const { data } = await apiClient.put<ApiResponse<null>>(
        "/auth/users/change/password",
        payload
    );
    return data;
}

export async function deleteAccount(): Promise<ApiResponse<null>> {
    const { data } = await apiClient.delete<ApiResponse<null>>(
        "/auth/users/delete/me"
    );
    return data;
}