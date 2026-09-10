export interface User {
    user_id: string;
    email: string;
    username: string;
    firstname: string;
    lastname: string;

}

export interface LoginData {
    accessToken?: string; // optional now that tokens live in cookies, not the body
    refreshToken?: string;
    user: User;
}

export interface RegisterData {
    user: User;
}

// describes what the user is supposed to send to the backend
export interface RegisterPayload {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
}