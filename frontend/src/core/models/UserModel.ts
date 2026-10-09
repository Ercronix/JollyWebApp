// src/core/models/UserModel.ts
import {logger} from "@/utils/logger";
export type User = {
    id: string;
    username: string;
    fullTag: string;  // e.g., "Tim#4523"
    createdAt: string;
};

const STORAGE_KEY = "app_user_v2";  // Changed version to migrate from old schema
const LAST_TAG_KEY = "app_last_tag";

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
            if (!parsed || !parsed.id || !parsed.fullTag) return;
            this.currentUser = parsed;
        } catch (e) {
            logger.warn("UserModel: failed to load from storage", e);
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
            logger.warn("UserModel: failed to save to storage", e);
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

    /**
     * Called when the server rejects the session. Remembers the tag so the user
     * can log back into the same account instead of creating a new one.
     */
    expireSession(): void {
        if (this.currentUser) {
            try {
                localStorage.setItem(LAST_TAG_KEY, this.currentUser.fullTag);
            } catch (e) {
                logger.warn("UserModel: failed to remember tag", e);
            }
        }
        this.clearUser();
    }

    getLastFullTag(): string | null {
        try {
            return localStorage.getItem(LAST_TAG_KEY);
        } catch {
            return null;
        }
    }

    // Helper to get display name (just the username part)
    getDisplayName(): string | null {
        if (!this.currentUser) return null;
        return this.currentUser.username;
    }

    // Helper to get the discriminator (the #1234 part)
    getDiscriminator(): string | null {
        if (!this.currentUser) return null;
        const parts = this.currentUser.fullTag.split('#');
        return parts.length === 2 ? `#${parts[1]}` : null;
    }
}