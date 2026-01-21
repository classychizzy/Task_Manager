import { TaskStatus } from "../enums/TaskStatus_enum";


export class TaskDTO {
    title: string;
    description: string;
    dueDate: string;
    status: TaskStatus;
}