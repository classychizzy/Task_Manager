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
exports.Task_entity = void 0;
const user_entity_1 = require("./user_entity");
const comments_entity_1 = require("./comments_entity");
const projects_entity_1 = require("./projects_entity");
const TaskStatus_enum_1 = require("../enums/TaskStatus_enum");
const Task_assignment_entity_1 = require("./Task_assignment_entity");
const typeorm_1 = require("typeorm");
let Task_entity = class Task_entity {
};
exports.Task_entity = Task_entity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Task_entity.prototype, "task_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Task_entity.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Task_entity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: TaskStatus_enum_1.TaskStatus, default: TaskStatus_enum_1.TaskStatus.PENDING }),
    __metadata("design:type", String)
], Task_entity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Task_entity.prototype, "dueDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], Task_entity.prototype, "priority_level", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], Task_entity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], Task_entity.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: null, nullable: true }),
    __metadata("design:type", Object)
], Task_entity.prototype, "deleted_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Task_entity.prototype, "is_deleted", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User_entity, (user) => user.tasks, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: "user_id" }),
    __metadata("design:type", user_entity_1.User_entity)
], Task_entity.prototype, "User", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => projects_entity_1.Project_entity, (project) => project.tasks),
    (0, typeorm_1.JoinColumn)({ name: "project_id" }),
    __metadata("design:type", projects_entity_1.Project_entity)
], Task_entity.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Task_assignment_entity_1.Task_assignment_entity, (task_assignment) => task_assignment.task),
    __metadata("design:type", Array)
], Task_entity.prototype, "task_assignments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => comments_entity_1.Comment_Entity, (comment) => comment.task),
    __metadata("design:type", Array)
], Task_entity.prototype, "comments", void 0);
exports.Task_entity = Task_entity = __decorate([
    (0, typeorm_1.Entity)({ name: 'tasks', schema: 'public' })
], Task_entity);
