import apiClient from "./client";
import type { ApiResponse } from "../types/Responsehandler";
import type { Task } from "../types/task";

export async function getTasks(): Promise<ApiResponse<Task[]>> {
    const { data } = await apiClient.get<ApiResponse<Task[]>>("/tasks");
    return data;
}

export async function getTask(task_id: string): Promise<ApiResponse<Task>> {
    const { data } = await apiClient.get<ApiResponse<Task>>(`/tasks/${task_id}`);
    return data;
}
