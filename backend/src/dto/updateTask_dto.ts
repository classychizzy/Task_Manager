import { TaskStatus } from "../enums/TaskStatus_enum";
import { IsString, MinLength, IsEnum, IsOptional, Matches } from 'class-validator';
import { Transform } from "class-transformer";

export class UpdateTaskDTO {
    @IsOptional()
    @IsString()
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @Matches(/^(?=.*[a-zA-Z])[a-zA-Z0-9 .,_]{5,100}$/, {
        message: "Title must contain at least one letter and only include letters, numbers, spaces, and basic punctuation (. , _)",
    })
    @MinLength(5, { message: "Title must be at least 5 characters long" })
    title?: string;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @Matches(/^[a-zA-Z0-9 .,!?'"()$%\-\n]+$/, {
        message: "Description contains invalid characters",
    })
    @MinLength(15, { message: "Description must be at least 15 characters long" })
    description?: string;

    @IsOptional()
    @IsString()
    dueDate?: string;

    @IsOptional()
    @IsEnum(TaskStatus, { message: "Status must be a valid task status" })
    status?: TaskStatus;
}