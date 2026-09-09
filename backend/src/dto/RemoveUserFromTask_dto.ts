import { IsEmail } from "class-validator";
import { Transform } from "class-transformer";

export class RemoveUserFromTaskDTO {
    @IsEmail({}, { message: "Invalid email format" })
    @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
    email: string;
}