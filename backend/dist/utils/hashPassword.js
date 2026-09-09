"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.comparePassword = exports.hashPassword = void 0;
//this file does nothing, it's just for understanding how hashing works under the hood.
const bcrypt_1 = __importDefault(require("bcrypt"));
const salt_Rounds = 10;
const hashPassword = async (password) => {
    const salt = await bcrypt_1.default.genSalt(salt_Rounds);
    const hashedPassword = await bcrypt_1.default.hash(password, salt);
    return hashedPassword;
};
exports.hashPassword = hashPassword;
const comparePassword = async (password, hashedPassword) => {
    return await bcrypt_1.default.compare(password, hashedPassword);
};
exports.comparePassword = comparePassword;
