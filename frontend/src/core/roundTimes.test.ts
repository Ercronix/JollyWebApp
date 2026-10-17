import {describe, expect, it} from "vitest";
import {roundDurations, roundTimeStats} from "./roundTimes";

const t = (min: number) => new Date(Date.UTC(2026, 0, 1, 12, min)).toISOString();
const MIN = 60_000;

// Issue #48: per-round times
describe("roundDurations", () => {
    it("times each finished round from the end of the previous one", () => {
        const game = {createdAt: t(0), roundEndedAt: [t(4), t(6), t(17)], currentRound: 4, isFinished: false};

        expect(roundDurations(game, Date.parse(t(20)))).toEqual({rounds: [4 * MIN, 2 * MIN, 11 * MIN], liveMs: 3 * MIN});
    });

    it("has no live round once the game is finished", () => {
        const game = {createdAt: t(0), roundEndedAt: [t(4), t(6)], currentRound: 2, isFinished: true};

        expect(roundDurations(game, Date.parse(t(20)))).toEqual({rounds: [4 * MIN, 2 * MIN], liveMs: null});
    });

    it("times a game that ended in round 1", () => {
        const game = {createdAt: t(0), roundEndedAt: [t(5)], currentRound: 1, isFinished: true};

        expect(roundDurations(game, Date.parse(t(20)))).toEqual({rounds: [5 * MIN], liveMs: null});
    });

    it("times the first round live before any round has ended", () => {
        const game = {createdAt: t(0), roundEndedAt: [], currentRound: 1, isFinished: false};

        expect(roundDurations(game, Date.parse(t(2)))).toEqual({rounds: [], liveMs: 2 * MIN});
    });

    it("never reports a negative live time", () => {
        // The client's clock runs behind the server's
        const game = {createdAt: t(0), roundEndedAt: [t(4)], currentRound: 2, isFinished: false};

        expect(roundDurations(game, Date.parse(t(3)))?.liveMs).toBe(0);
    });

    it.each([
        ["missing", {roundEndedAt: undefined, currentRound: 3, isFinished: false}],
        ["incomplete for a running game", {roundEndedAt: [t(4)], currentRound: 3, isFinished: false}],
        ["incomplete for a finished game", {roundEndedAt: [t(4)], currentRound: 2, isFinished: true}],
    ])("returns null when round times weren't recorded (%s)", (_, game) => {
        expect(roundDurations({createdAt: t(0), ...game}, Date.parse(t(20)))).toBeNull();
    });
});

describe("roundTimeStats", () => {
    it("sums, averages and finds the longest and shortest round", () => {
        expect(roundTimeStats([4 * MIN, 2 * MIN, 11 * MIN])).toEqual({
            totalMs: 17 * MIN,
            averageMs: 17 * MIN / 3,
            longest: {round: 3, ms: 11 * MIN},
            shortest: {round: 2, ms: 2 * MIN},
        });
    });

    it("has no stats without finished rounds", () => {
        expect(roundTimeStats([])).toBeNull();
    });
});
