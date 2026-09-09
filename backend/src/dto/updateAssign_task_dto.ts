import { IsIn, IsNotEmpty } from "class-validator";
import { TaskPermission } from "../enums/Taskpermission_enum";

export class UpdateTaskPermissionDTO {
    @IsNotEmpty({ message: "Permission is required" })
    @IsIn([TaskPermission.VIEW, TaskPermission.EDIT], { message: "Permission must be 'view' or 'edit'" })
    permission: TaskPermission;
}