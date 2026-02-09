"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentRepository = void 0;
const ormconfig_1 = __importDefault(require("../ormconfig"));
const comments_entity_1 = require("../entities/comments_entity");
exports.CommentRepository = ormconfig_1.default.getRepository(comments_entity_1.Comment_Entity).extend({});
