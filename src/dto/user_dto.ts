import { IsEmail, IsString, MinLength, IsOptional, IsInt, Matches, IsNotEmpty } from "class-validator";
import { Transform } from "class-transformer";

export class UserDTO {

    @IsOptional()
    @IsInt()
    user_id?: number;

    @IsString()
    @Transform(({ value }) => value.trim()) //whitespace protection
    @Matches(/.*[a-zA-Z].*/, { message: "First name must be an actual word" })
    @MinLength(3, { message: "First name must be at least 3 characters long" })
    firstName: string;

    @IsString()
    @Transform(({ value }) => value.trim())
    @Matches(/.*[a-zA-Z].*/, { message: "Last name must be an actual word" })
    @MinLength(3, { message: "Last name must be at least 3 characters long" })
    lastName: string;

    @IsString()
    @Transform(({ value }) => value.trim())
   @Matches(/^(?=.*[a-zA-Z])[a-zA-Z0-9._-]{3,30}$/, {
  message: "Username must contain at least one letter and can include letters, numbers, periods, underscores, and hyphens",
}) //standard practice
    @MinLength(3, { message: "Username must be at least 3 characters long" })
    username: string;

    @IsEmail({}, { message: "Please provide a valid email" })
    @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
    email: string;

    @IsString()
    @MinLength(8)
    @IsNotEmpty()
    @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, { message: "Password must be at least 8 characters long and contain at least one uppercase letter, one number, and one special character" })
    password: string;

}