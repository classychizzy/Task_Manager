//this file does nothing, it's just for understanding how hashing works under the hood.
import bcrypt from 'bcrypt'

const salt_Rounds = 10;
export const hashPassword = async (password: string) => {
    const salt = await bcrypt.genSalt(salt_Rounds);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
}

export const comparePassword = async (password: string, hashedPassword: string) => {
    return await bcrypt.compare(password, hashedPassword);
}