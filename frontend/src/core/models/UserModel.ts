// UserModel.ts
export type User = {
    id: string;
    username: string;
    createdAt: Date;
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
            this.currentUser = {
                ...parsed,
                createdAt: parsed.createdAt ? new Date(parsed.createdAt) : new Date(),
            };
        } catch (e) {
            // If storage is corrupted or unavailable, ignore and start fresh
            console.warn("UserModel: failed to load from storage", e);
            this.currentUser = null;
        }
    }

    private saveToStorage(): void {
        try {
            if (this.currentUser) {
                const toSave = {
                    ...this.currentUser,
                    createdAt: this.currentUser.createdAt.toISOString(),
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
            } else {
                localStorage.removeItem(STORAGE_KEY);
            }
        } catch (e) {
            console.warn("UserModel: failed to save to storage", e);
        }
    }

    setUser(username: string): User {
        const id = typeof crypto !== "undefined" && (crypto as any).randomUUID
            ? (crypto as any).randomUUID()
            : String(Date.now()) + Math.random().toString(36).slice(2, 9);

        const user: User = {
            id,
            username: username.trim(),
            createdAt: new Date(),
        };

        this.currentUser = user;
        this.saveToStorage();
        return user;
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
