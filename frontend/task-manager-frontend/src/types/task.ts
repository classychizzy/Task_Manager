// src/types/task.ts
export interface Task {
    task_id: string;
    project_id: string;
    title: string;
    status: "todo" | "progress" | "done";
}