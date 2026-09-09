import { IsOptional, IsString, Matches, MinLength } from "class-validator";
import { Transform } from "class-transformer";

export class UpdateProjectDTO {
    @IsString()
    @IsOptional()
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @Matches(/^(?=.*[a-zA-Z])[a-zA-Z0-9 .,_]{5,100}$/, {
        message: "Project name must contain at least one letter and only include letters, numbers, spaces, and basic punctuation (. , _)",
    })
    @MinLength(5, { message: "Project name must be at least 5 characters long" })
    name: string;

    @IsString()
    @IsOptional()
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @Matches(/^[a-zA-Z0-9 .,!?'"()$%\-\n]+$/, {
        message: "Project description contains invalid characters",
    })
    @MinLength(10, { message: "Project description must be at least 10 characters long" })
    description: string;

}