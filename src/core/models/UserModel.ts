// UserModel.ts
export type User = {
    id: string;
    username: string;
    createdAt: Date;
};

export class UserModel {
    private static instance: UserModel;
    private currentUser: User | null = null;

    private constructor() {
        // Private constructor for singleton
    }

    static getInstance(): UserModel {
        if (!UserModel.instance) {
            UserModel.instance = new UserModel();
        }
        return UserModel.instance;
    }

    setUser(username: string): User {
        const user: User = {
            id: crypto.randomUUID(),
            username: username.trim(),
            createdAt: new Date()
        };
        this.currentUser = user;
        return user;
    }

    getCurrentUser(): User | null {
        return this.currentUser;
    }

    clearUser(): void {
        this.currentUser = null;
    }

    isLoggedIn(): boolean {
        return this.currentUser !== null;
    }

    getUsername(): string {
        return this.currentUser?.username || '';
    }

    getUserId(): string {
        return this.currentUser?.id || '';
    }
}