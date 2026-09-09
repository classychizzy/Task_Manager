import { IsString, MinLength, Matches } from "class-validator";

export class ChangePasswordDTO {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8, { message: "New password must be at least 8 characters long" })
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).*$/, {
    message: "New password must contain at least one uppercase letter, one lowercase letter, and one number",
  })
  newPassword: string;
}