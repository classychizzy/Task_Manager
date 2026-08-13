import { IsString, IsNotEmpty } from "class-validator";

export class RefreshTokenDTO {
    @IsString()
    @IsNotEmpty({ message: "Refresh token is required" })
    refreshToken: string;
}