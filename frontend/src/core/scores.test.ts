import {describe, expect, it} from "vitest";
import {isScoreInput, parseScore, validateScore, validateWinCondition} from "./scores";

describe("isScoreInput", () => {
    it.each(["", "-", "5", "-25", "120"])("allows %j while typing", (value) => {
        expect(isScoreInput(value)).toBe(true);
    });

    it.each(["a", "1.5", "--5", "5-", " 5", "1e3"])("blocks %j", (value) => {
        expect(isScoreInput(value)).toBe(false);
    });
});

describe("parseScore", () => {
    it("parses whole numbers", () => {
        expect(parseScore("-25")).toBe(-25);
    });

    it.each(["", "-", "abc"])("returns NaN for %j", (value) => {
        expect(parseScore(value)).toBeNaN();
    });
});

describe("validateScore", () => {
    it.each([0, 5, -5, 100000, -100000])("accepts %j", (score) => {
        expect(validateScore(score)).toBeNull();
    });

    it("rejects scores not divisible by 5", () => {
        expect(validateScore(7)).toBe("Score must be divisible by 5");
    });

    it("rejects non-numbers", () => {
        expect(validateScore(NaN)).toBe("Please enter a valid number");
    });

    // The backend rejects anything beyond ±100000
    it("rejects scores beyond the server limit", () => {
        expect(validateScore(100005)).toBe("Score must be between -100000 and 100000");
    });
});

describe("validateWinCondition", () => {
    it.each([100, 1000, 10000])("accepts %j", (value) => {
        expect(validateWinCondition(value)).toBeNull();
    });

    it.each([NaN, 99, 10001, 150.5])("rejects %j", (value) => {
        expect(validateWinCondition(value)).toBe("Win condition must be a whole number between 100 and 10000");
    });
});
