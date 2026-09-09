export interface User {
    user_id: string;
    email: string;
    username: string;
    [key: string]: unknown;
}

export interface LoginData {
    accessToken?: string; // optional now that tokens live in cookies, not the body
    refreshToken?: string;
    user: User;
}