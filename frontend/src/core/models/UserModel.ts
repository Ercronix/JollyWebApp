// src/core/models/UserModel.ts
export type User = {
    id: string;
    username: string;
    createdAt: string;
};

const STORAGE_KEY = "app_user_v1";

export class UserModel {
    private static instance: UserModel;
    private currentUser: User | null = null;

    private constructor() {
        this.loadFromStorage();
    }

    static getInstance(): UserModel {
        if (!UserModel.instance) {
            UserModel.instance = new UserModel();
        }
        return UserModel.instance;
    }

    private loadFromStorage(): void {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (!parsed || !parsed.id) return;
            this.currentUser = parsed;
        } catch (e) {
            console.warn("UserModel: failed to load from storage", e);
            this.currentUser = null;
        }
    }

    private saveToStorage(): void {
        try {
            if (this.currentUser) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentUser));
            } else {
                localStorage.removeItem(STORAGE_KEY);
            }
        } catch (e) {
            console.warn("UserModel: failed to save to storage", e);
        }
    }

    setUser(user: User): void {
        this.currentUser = user;
        this.saveToStorage();
    }

    getCurrentUser(): User | null {
        return this.currentUser;
    }

    clearUser(): void {
        this.currentUser = null;
        this.saveToStorage();
    }

    isLoggedIn(): boolean {
        return this.currentUser !== null;
    }

    getUsername(): string {
        return this.currentUser?.username || "";
    }

    getUserId(): string {
        return this.currentUser?.id || "";
    }
}