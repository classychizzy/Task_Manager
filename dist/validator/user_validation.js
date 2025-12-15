"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEmail = validateEmail;
exports.validatePassword = validatePassword;
const class_validator_1 = require("class-validator");
//create a function to validate email and return true if valid
function validateEmail(email) {
    if ((0, class_validator_1.isEmail)(email)) {
        return true;
    }
    return false;
}
//password validation
function validatePassword(password) {
    if (password.length >= 10) {
        return true;
    }
    return false;
}
