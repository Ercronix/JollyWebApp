export interface User {
    id: string;
    username: string;
    fullTag: string;
    createdAt: string;
}

export interface LoginResponse {
    user: User;
    sessionId: string;
    isNewAccount?: boolean;
}

export interface RegisterResponse {
    user: User;
    sessionId: string;
}