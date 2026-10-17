import {describe, expect, it} from "vitest";
import {formatDuration} from "./duration";

// Issue #48: how long the game is running
describe("formatDuration", () => {
    it.each([
        [0, "0:00"],
        [59_999, "0:59"],
        [61_000, "1:01"],
        [59 * 60_000 + 59_000, "59:59"],
        [3_600_000, "1:00:00"],
        [26 * 3_600_000 + 5 * 60_000 + 7_000, "26:05:07"],
    ])("formats %i ms as %s", (ms, expected) => {
        expect(formatDuration(ms)).toBe(expected);
    });

    it("never shows a negative time (clock skew between client and server)", () => {
        expect(formatDuration(-5_000)).toBe("0:00");
    });
});
