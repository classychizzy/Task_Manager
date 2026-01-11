"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshRepository = void 0;
const ormconfig_1 = __importDefault(require("../ormconfig"));
const refresh_entity_1 = require("../entities/refresh_entity");
exports.RefreshRepository = ormconfig_1.default.getRepository(refresh_entity_1.Refresh_entity).extend({});
