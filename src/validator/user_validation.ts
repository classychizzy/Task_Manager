import { isEmail} from "class-validator";

//create a function to validate email and return true if valid
export function validateEmail(email: string){
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