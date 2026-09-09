"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskRepository = void 0;
const ormconfig_1 = __importDefault(require("../ormconfig"));
const task_entity_1 = require("../entities/task_entity");
exports.TaskRepository = ormconfig_1.default.getRepository(task_entity_1.Task_entity).extend({});
