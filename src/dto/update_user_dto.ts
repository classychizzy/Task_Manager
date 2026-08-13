import { IsEmail, IsString, IsOptional, MinLength, Matches } from "class-validator";
import { Transform } from "class-transformer";

export class UpdateUserDTO {
    @IsString()
    @IsOptional()
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @Matches(/^(?=.*[a-zA-Z])[a-zA-Z0-9 .,'_-]{3,50}$/, { message: "First name must contain at least one letter and only include letters, numbers, spaces, and basic punctuation" })
    @MinLength(3, { message: "First name must be at least 3 characters long" })
    firstName?: string;

    @IsString()
    @IsOptional()
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @Matches(/^(?=.*[a-zA-Z])[a-zA-Z0-9 .,'_-]{3,50}$/, { message: "Last name must contain at least one letter and only include letters, numbers, spaces, and basic punctuation" })
    @MinLength(3, { message: "Last name must be at least 3 characters long" })
    lastName?: string;

    @IsString()
    @IsOptional()
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @Matches(/^(?=.*[a-zA-Z])[a-zA-Z0-9_]{3,30}$/, { message: "Username must be an actual word or alphanumeric" })
    @MinLength(3, { message: "Username must be at least 3 characters long" })
    username?: string;

    @IsEmail({}, { message: "Please provide a valid email" })
    @IsOptional()
    @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
    email?: string;
}