import { IsString, IsNotEmpty, MinLength, MaxLength, Matches } from "class-validator";
import { Transform } from "class-transformer";

export class CommentDTO {
    @IsString()
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @IsNotEmpty({ message: "Comment cannot be empty" })
    @MinLength(1, { message: "Comment must contain at least 1 character" })
    @MaxLength(2000, { message: "Comment cannot exceed 2000 characters" })
    @Matches(/\S/, { message: "Comment cannot be whitespace only" })
    content: string;
}