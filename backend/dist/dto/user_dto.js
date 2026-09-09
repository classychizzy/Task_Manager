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
exports.UserDTO = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class UserDTO {
}
exports.UserDTO = UserDTO;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UserDTO.prototype, "user_id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(({ value }) => value.trim()) //whitespace protection
    ,
    (0, class_validator_1.Matches)(/.*[a-zA-Z].*/, { message: "First name must be an actual word" }),
    (0, class_validator_1.MinLength)(3, { message: "First name must be at least 3 characters long" }),
    __metadata("design:type", String)
], UserDTO.prototype, "firstName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(({ value }) => value.trim()),
    (0, class_validator_1.Matches)(/.*[a-zA-Z].*/, { message: "Last name must be an actual word" }),
    (0, class_validator_1.MinLength)(3, { message: "Last name must be at least 3 characters long" }),
    __metadata("design:type", String)
], UserDTO.prototype, "lastName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(({ value }) => value.trim()),
    (0, class_validator_1.Matches)(/^(?=.*[a-zA-Z])[a-zA-Z0-9._-]{3,30}$/, {
        message: "Username must contain at least one letter and can include letters, numbers, periods, underscores, and hyphens",
    }) //standard practice
    ,
    (0, class_validator_1.MinLength)(3, { message: "Username must be at least 3 characters long" }),
    __metadata("design:type", String)
], UserDTO.prototype, "username", void 0);
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: "Please provide a valid email" }),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value),
    __metadata("design:type", String)
], UserDTO.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Matches)(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, { message: "Password must be at least 8 characters long and contain at least one uppercase letter, one number, and one special character" }),
    __metadata("design:type", String)
], UserDTO.prototype, "password", void 0);
