import {afterEach, describe, expect, it} from "vitest";
import {UserModel, type User} from "./UserModel";

const user: User = {id: "1", username: "Tim", fullTag: "Tim#4523", createdAt: "2026-01-01"};

afterEach(() => {
    UserModel.getInstance().clearUser();
    localStorage.clear();
});

describe("UserModel", () => {
    it("persists the user to localStorage", () => {
        UserModel.getInstance().setUser(user);

        expect(JSON.parse(localStorage.getItem("app_user_v2")!)).toEqual(user);
    });

    it("forgets the user but remembers the tag when the session expires", () => {
        const model = UserModel.getInstance();
        model.setUser(user);

        model.expireSession();

        expect(model.getCurrentUser()).toBeNull();
        expect(model.getLastFullTag()).toBe("Tim#4523");
    });

    it("splits the display name and discriminator", () => {
        const model = UserModel.getInstance();
        model.setUser(user);

        expect(model.getDisplayName()).toBe("Tim");
        expect(model.getDiscriminator()).toBe("#4523");
    });
});
