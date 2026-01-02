import { isEmail} from "class-validator";

//create a function to validate email and return true if valid
export function validateEmail(email: string){
    console.log(`email : ${isEmail(email)}`);
    if(isEmail(email)){
        return true;
    }
    return false;
}

//password validation
export function validatePassword(password: string){
    if(password.length >= 10){
        return true;
    }
    return false;
}

/**const emailRegex: RegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export function validateEmailRegex(email: string): boolean {
   return emailRegex.test(email);
}
const email = "[email protected]";
console.log(validateEmail(email)); // Output: true
*/

//