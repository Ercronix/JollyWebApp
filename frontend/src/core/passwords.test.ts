import {describe, expect, it} from "vitest";
import {PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, validatePassword} from "./passwords";

describe("validatePassword", () => {
    it("matches the backend limits", () => {
        expect(PASSWORD_MIN_LENGTH).toBe(4);
        expect(PASSWORD_MAX_LENGTH).toBe(72);
    });

    it.each(["abc", "x".repeat(73)])("rejects %j", (password) => {
        expect(validatePassword(password)).toBe("Password must be between 4 and 72 characters");
    });

    it.each(["abcd", "x".repeat(72)])("accepts %j", (password) => {
        expect(validatePassword(password)).toBeNull();
    });
});
