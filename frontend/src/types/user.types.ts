export interface User {
    id: string;
    username: string;
    createdAt: string;
}

export interface LoginResponse {
    user: User;
    sessionId: string;
}