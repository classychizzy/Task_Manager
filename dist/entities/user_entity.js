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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User_entity = void 0;
const comments_entity_1 = require("./comments_entity");
const projects_entity_1 = require("./projects_entity");
const Task_assignment_entity_1 = require("./Task_assignment_entity");
const task_entity_1 = require("./task_entity");
const typeorm_1 = require("typeorm");
const bcrypt_1 = __importDefault(require("bcrypt"));
let User_entity = class User_entity {
    hashPassword() {
        this.password = bcrypt_1.default.hashSync(this.password, 8);
    }
    checkIfUnencryptedPasswordIsValid(unencryptedPassword) {
        return bcrypt_1.default.compareSync(unencryptedPassword, this.password);
    }
};
exports.User_entity = User_entity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], User_entity.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], User_entity.prototype, "firstName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], User_entity.prototype, "lastName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], User_entity.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, unique: true }),
    __metadata("design:type", String)
], User_entity.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], User_entity.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], User_entity.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], User_entity.prototype, "is_deleted", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], User_entity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], User_entity.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => projects_entity_1.Project_entity, (project) => project.user),
    __metadata("design:type", Array)
], User_entity.prototype, "projects", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => task_entity_1.Task_entity, (task) => task.User),
    __metadata("design:type", Array)
], User_entity.prototype, "tasks", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => comments_entity_1.Comment_Entity, (comment) => comment.user),
    __metadata("design:type", Array)
], User_entity.prototype, "comments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Task_assignment_entity_1.Task_assignment_entity, (task_assignment) => task_assignment.user),
    __metadata("design:type", Array)
], User_entity.prototype, "task_assignments", void 0);
exports.User_entity = User_entity = __decorate([
    (0, typeorm_1.Entity)({ name: 'users', schema: 'public' })
], User_entity);
