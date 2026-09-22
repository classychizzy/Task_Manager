// src/api/projects.ts
import apiClient from "./client";
import type { ApiResponse } from "../types/Responsehandler";
import type { Project, PaginationMeta, createProject } from "../types/project";

export interface ProjectsResponse extends ApiResponse<Project[]> {
    meta?: PaginationMeta;
}

export async function getAllProjects(page = 1, limit = 10): Promise<ProjectsResponse> {
    const { data } = await apiClient.get<ProjectsResponse>("/projects/all", {
        params: { page, limit },
    });
    return data;
}

export async function createProject(
    payload: createProject
): Promise<ApiResponse<Project>> {
    const { data } = await apiClient.post<ApiResponse<Project>>(
        "/projects/create",
        payload
    );
    return data;
}