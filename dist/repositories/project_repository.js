"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectRepository = void 0;
const ormconfig_1 = __importDefault(require("../ormconfig"));
const projects_entity_1 = require("../entities/projects_entity");
exports.ProjectRepository = ormconfig_1.default.getRepository(projects_entity_1.Project_entity).extend({});
