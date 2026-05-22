import { IsInt, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from "class-validator";

export class CreateProjectDTO {
    @IsOptional()
    @IsInt()
    project_id?: number;

    @IsString()
    //ensure project name is an actual word not a single character or numbered string, can have spaces
    @Matches(/.*[a-zA-Z].*/, { message: "Project name must be an actual word" })
    @MinLength(5, { message: "Project name must be at least 5 characters long" })
    @IsNotEmpty({ message: "Project name is required" })
    name: string;

    @IsString()
    //ensure project description contains only alphabetic characters and spaces
    @Matches(/^[a-zA-Z ]+$/, { message: "Project description must contain only alphabetic characters and spaces" })
    @MinLength(10, { message: "Project description must be at least 10 characters long" })
    @IsNotEmpty({ message: "Project description is required" })
    description: string;

}