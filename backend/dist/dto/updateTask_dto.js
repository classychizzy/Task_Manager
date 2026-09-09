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
exports.UpdateTaskDTO = void 0;
const TaskStatus_enum_1 = require("../enums/TaskStatus_enum");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class UpdateTaskDTO {
}
exports.UpdateTaskDTO = UpdateTaskDTO;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.trim() : value),
    (0, class_validator_1.Matches)(/^(?=.*[a-zA-Z])[a-zA-Z0-9 .,_]{5,100}$/, {
        message: "Title must contain at least one letter and only include letters, numbers, spaces, and basic punctuation (. , _)",
    }),
    (0, class_validator_1.MinLength)(5, { message: "Title must be at least 5 characters long" }),
    __metadata("design:type", String)
], UpdateTaskDTO.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.trim() : value),
    (0, class_validator_1.Matches)(/^[a-zA-Z0-9 .,!?'"()$%\-\n]+$/, {
        message: "Description contains invalid characters",
    }),
    (0, class_validator_1.MinLength)(15, { message: "Description must be at least 15 characters long" }),
    __metadata("design:type", String)
], UpdateTaskDTO.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTaskDTO.prototype, "dueDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(TaskStatus_enum_1.TaskStatus, { message: "Status must be a valid task status" }),
    __metadata("design:type", String)
], UpdateTaskDTO.prototype, "status", void 0);
