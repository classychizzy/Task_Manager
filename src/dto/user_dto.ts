import { IsEmail, isBoolean, length, IsString  } from "class-validator";
//create user entity dto
export interface UserDTO{

    user_id?: number;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    isActive: boolean;
    created_at?: Date;
    updated_at?: Date;

}