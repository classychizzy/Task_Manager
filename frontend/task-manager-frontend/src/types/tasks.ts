export type TaskStatus = "pending" | "in_progress" | "completed" | "overdue";
//union is preferred over enum in this case. get enum from backend

export interface Task {
    task_id: number;
    title: string;
    description: string;
    status: TaskStatus;
    dueDate: string | null;
    is_notified: boolean;
    priority_level: number;
    created_at: string;
    updated_at: string;
    is_deleted: boolean;
    deleted_at: string | null;
    project?: {
        project_id: number;
        name: string;
    };
}

export interface CreateTaskPayload {
    title: string;
    description: string;
    dueDate: string;
    status?: TaskStatus;
}

export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}