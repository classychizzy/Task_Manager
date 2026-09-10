// src/api/projects.ts
import apiClient from "./client";
import type { ApiResponse } from "../types/Responsehandler";
import type { Project } from "../types/project";

export async function getProjects(): Promise<ApiResponse<Project[]>> {
    const { data } = await apiClient.get<ApiResponse<Project[]>>("/projects");
    return data;
}

export async function getProject(project_id: string): Promise<ApiResponse<Project>> {
    const { data } = await apiClient.get<ApiResponse<Project>>(`/projects/${project_id}`);
    return data;
}