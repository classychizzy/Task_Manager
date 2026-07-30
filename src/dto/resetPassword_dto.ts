import { IsString, MinLength, IsNotEmpty, Matches } from "class-validator";

export class ResetPasswordDto {

    @IsNotEmpty()
    @IsString()
    token: string

    @IsString()
    @MinLength(8)
    @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, { message: "Password must be at least 8 characters long and contain at least one uppercase letter, one number, and one special character" })
    newPassword: string
}