import { TaskStatus } from "../enums/TaskStatus_enum";
import { IsString, MinLength, IsEnum, IsNotEmpty, Matches, IsOptional } from 'class-validator';
import { Transform } from "class-transformer";

export class TaskDTO {
    @IsString()
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @IsNotEmpty({ message: "Title is required" })
    @Matches(/^(?=.*[a-zA-Z])[a-zA-Z0-9 .,_]{5,100}$/, {
        message: "Title must contain at least one letter and only include letters, numbers, spaces, and basic punctuation (. , _)",
    })
    @MinLength(5, { message: "Title must be at least 5 characters long" })
    title: string;

    @IsString()
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @IsNotEmpty()
    @Matches(/^[a-zA-Z0-9 .,!?'"()$%\-\n]+$/, {
        message: "Description contains invalid characters",
    })
    @MinLength(15, { message: "Description must be at least 15 characters long" })
    description: string;

    @IsString()
    @IsNotEmpty({ message: "Due date is required" })
    dueDate: string;

    @IsEnum(TaskStatus, { message: "Status must be a valid task status" })
    @IsOptional()
    status: TaskStatus;
}