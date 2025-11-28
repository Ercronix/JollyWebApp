export type User = {
    id: string;
    username: string;
    createdAt: string;
};

const STORAGE_KEY = "app_user_v2";

export const userService = {
    getUser(): User | null {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    },

    setUser(username: string): User {
        const user: User = {
            id: crypto.randomUUID(),
            username,
            createdAt: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        return user;
    },

    clearUser() {
        localStorage.removeItem(STORAGE_KEY);
    }
};
