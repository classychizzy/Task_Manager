import { IsArray, ArrayMinSize, ArrayMaxSize, ValidateNested, IsEmail, IsOptional, IsIn } from "class-validator";
import { Type, Transform } from "class-transformer";
import { TaskPermission } from "../enums/Taskpermission_enum";

class BulkAssignmentEntry {
    @IsEmail({}, { message: "Invalid email format" })
    @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
    email: string;

    @IsOptional()
    @IsIn([TaskPermission.VIEW, TaskPermission.EDIT], { message: "Permission must be 'view' or 'edit'" })
    permission?: TaskPermission;
}

export class BulkAssignTaskDTO {
    @IsArray()
    @ArrayMinSize(1, { message: "At least one assignment is required" })
    @ArrayMaxSize(50, { message: "Cannot assign more than 50 users at once" })
    @ValidateNested({ each: true })
    @Type(() => BulkAssignmentEntry)
    assignments: BulkAssignmentEntry[];
}