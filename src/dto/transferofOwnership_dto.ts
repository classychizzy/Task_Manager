import { IsEmail } from "class-validator";
import { Transform } from "class-transformer";

export class TransferOwnershipDTO {
    @IsEmail({}, { message: "Invalid email format" })
    @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
    newOwnerEmail: string;
}