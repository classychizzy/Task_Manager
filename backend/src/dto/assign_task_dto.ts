
import { IsEmail, IsIn, IsOptional } from "class-validator";
import { Transform } from "class-transformer";
import { TaskPermission } from "../enums/Taskpermission_enum";

export class AssignTaskDTO {
    @IsEmail({}, { message: "Invalid email format" })
    @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
    email: string;

    @IsOptional()
    @IsIn([TaskPermission.VIEW, TaskPermission.EDIT], { message: "Permission must be 'view' or 'edit'" })
    permission?: TaskPermission;
}
