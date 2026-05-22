//import { Type } from "class-transformer";
import { TaskStatus } from "../enums/TaskStatus_enum";
import { IsString, MinLength, IsEnum, IsNotEmpty, Matches, IsNumber, IsOptional } from 'class-validator';

export class TaskDTO {

    @IsString()
    @IsNotEmpty({ message: "Title is required" })
    @Matches(/.*[a-zA-Z].*/, { message: "Title must contain only alphabetic characters and spaces" })
    @MinLength(5, { message: "Title must be at least 5 characters long" })
    title: string;

    @IsString()
    @MinLength(15, { message: "Description must be at least 15 characters long" })
    @IsNotEmpty()
    @Matches(/^[a-zA-Z ]+$/, { message: "Description must contain only alphabetic characters and spaces" })
    description: string;

    @IsString()
    @IsNotEmpty({ message: "Due date is required" })
    dueDate: string;

    @IsEnum(TaskStatus)
    @IsOptional()
    status: TaskStatus;

}