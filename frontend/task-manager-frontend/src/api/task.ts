import apiClient from "./client";
import type { ApiResponse } from "../types/Responsehandler";
import type { Task, CreateTaskPayload, PaginationMeta } from "../types/tasks";


export interface TasksResponse extends ApiResponse<Task[]> {
    meta?: PaginationMeta;
}
console.log('reading tasks api')
export async function getAllTasks(
    projectId: number,
    page = 1,
    limit = 10
): Promise<TasksResponse> {
    const { data } = await apiClient.get<TasksResponse>(
        `/tasks/all/${projectId}`,
        { params: { page, limit } }
    );
    return data;
}

export async function getTaskById(taskId: number): Promise<TasksResponse> {
    const { data } = await apiClient.get<TasksResponse>(`/tasks/${taskId}`);
    return data;
}

export async function createTask(
    projectId: number,
    payload: CreateTaskPayload
): Promise<TasksResponse> {
    const { data } = await apiClient.post<TasksResponse>(
        `/tasks/create/${projectId}`,
        payload
    );
    return data;
}
