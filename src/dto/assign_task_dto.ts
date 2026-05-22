
import { TaskPermission } from "../enums/Taskpermission_enum";
import { IsEmail, IsEnum } from "class-validator";

export class AssignTaskDTO {
    @IsEmail(undefined, { message: "Invalid email format" })
    email: string;

    @IsEnum(TaskPermission)
    permission?: TaskPermission;
}
