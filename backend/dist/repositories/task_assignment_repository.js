"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Task_assignment_Repository = void 0;
const ormconfig_1 = __importDefault(require("../ormconfig"));
const Task_assignment_entity_1 = require("../entities/Task_assignment_entity");
exports.Task_assignment_Repository = ormconfig_1.default.getRepository(Task_assignment_entity_1.Task_assignment_entity).extend({});
