"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkAssignTaskDTO = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const Taskpermission_enum_1 = require("../enums/Taskpermission_enum");
class BulkAssignmentEntry {
}
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: "Invalid email format" }),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value),
    __metadata("design:type", String)
], BulkAssignmentEntry.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)([Taskpermission_enum_1.TaskPermission.VIEW, Taskpermission_enum_1.TaskPermission.EDIT], { message: "Permission must be 'view' or 'edit'" }),
    __metadata("design:type", String)
], BulkAssignmentEntry.prototype, "permission", void 0);
class BulkAssignTaskDTO {
}
exports.BulkAssignTaskDTO = BulkAssignTaskDTO;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1, { message: "At least one assignment is required" }),
    (0, class_validator_1.ArrayMaxSize)(50, { message: "Cannot assign more than 50 users at once" }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => BulkAssignmentEntry),
    __metadata("design:type", Array)
], BulkAssignTaskDTO.prototype, "assignments", void 0);
