import { IsEmail, IsString, MinLength, IsOptional, IsInt, Matches } from "class-validator";

export class UpdateUserDTO {

    @IsOptional()
    @IsInt()
    user_id?: number;

    @IsString()
    @IsOptional()
    @Matches(/.*[a-zA-Z].*/, { message: "First name must be an actual word" })
    @MinLength(3, { message: "First name must be at least 3 characters long" })
    firstName?: string;

    @IsString()
    @IsOptional()
    @Matches(/.*[a-zA-Z].*/, { message: "Last name must be an actual word" })
    @MinLength(3, { message: "Last name must be at least 3 characters long" })
    lastName?: string;

    @IsString()
    @Matches(/^(?=.*[a-zA-Z])[a-zA-Z0-9]{3,30}$/, { message: "Username must be an actual word or alphanumeric" })
    @MinLength(3, { message: "Username must be at least 3 characters long" })
    username?: string;

    @IsEmail({}, { message: "Please provide a valid email" })
    @IsOptional()
    email?: string;

    //  had to change this it's not secure @IsString()
    // @MinLength(6, { message: "Password must be at least 6 characters long" })
    // @IsOptional()
    // password?: string;

}