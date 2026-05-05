import { IsEmail, IsString, MinLength, IsOptional, IsInt } from "class-validator";

export class UserDTO {

    @IsOptional()
    @IsInt()
    user_id?: number;

    @IsString()
    @MinLength(3, { message: "First name must be at least 3 characters long" })
    firstName: string;

    @IsString()
    @MinLength(3, { message: "Last name must be at least 3 characters long" })
    lastName: string;

    @IsString()
    @MinLength(3, { message: "Username must be at least 3 characters long" })
    username: string;

    @IsEmail({}, { message: "Please provide a valid email" })
    email: string;

    @IsString()
    @MinLength(6, { message: "Password must be at least 6 characters long" })
    password: string;

}