import { TaskStatus } from "../enums/TaskStatus_enum";
import { IsString, MinLength, IsEnum, IsDate } from 'class-validator';

export class TaskDTO {
    @IsString()
    title: string;

    @IsString()
    @MinLength(15)
    description: string;

    @IsDate()
    dueDate: string;

    @IsEnum(TaskStatus)
    status: TaskStatus;
}