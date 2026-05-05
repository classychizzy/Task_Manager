import { IsString, MinLength, IsEmail, IsOptional } from 'class-validator';

export class LoginDto {
    @IsEmail({}, { message: "Please provide a valid email" })
    email: string;

    @IsString()
    @MinLength(6, { message: "Password must be at least 6 characters long" })
    password: string;

    @IsString()
    @IsOptional()
    username?: string;

}