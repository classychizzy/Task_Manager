import { IsString, MinLength, IsEnum, IsOptional } from 'class-validator';


export class CommentDTO {
    @IsString()
    @MinLength(3, { message: "Comment cannot be empty" })
    content: string;

}