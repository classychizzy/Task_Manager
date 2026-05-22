import { IsInt, IsOptional, IsString, Matches, MinLength } from "class-validator";

export class UpdateProjectDTO {
    @IsOptional()
    @IsInt()
    project_id?: number;

    @IsString()
    @IsOptional()
    @Matches(/.*[a-zA-Z].*/, { message: "Project name must be an actual word" })
    @MinLength(5, { message: "Project name must be at least 5 characters long" })
    name: string;

    @IsString()
    @IsOptional()
    @Matches(/.*[a-zA-Z].*/, { message: "Project description must be an actual word" })
    @MinLength(10, { message: "Project description must be at least 10 characters long" })
    description: string;

}