// src/types/project.ts
import type { Task } from "./tasks";

export interface ProjectUser {
    user_id: number;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
}

export interface Project {
    project_id: number;
    name: string;
    description: string;
    is_deleted: boolean;
    created_at: string;
    user: ProjectUser;
    tasks: Task[];
}
export interface createProject {
    name: string;
    description: string;
}
export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}