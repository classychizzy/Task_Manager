"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEmail = validateEmail;
const class_validator_1 = require("class-validator");
//create a function to validate email and return true if valid
function validateEmail(email) {
    console.log(`email : ${(0, class_validator_1.isEmail)(email)}`);
    if ((0, class_validator_1.isEmail)(email)) {
        return true;
    }
    return false;
}
//password validation
// export function validatePassword(password: string){
//     if(password.length >= 10){
//         return true;
//     }
//     return false;
// }
/**const emailRegex: RegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export function validateEmailRegex(email: string): boolean {
   return emailRegex.test(email);
}
const email = "[email protected]";
console.log(validateEmail(email)); // Output: true
*/
//
