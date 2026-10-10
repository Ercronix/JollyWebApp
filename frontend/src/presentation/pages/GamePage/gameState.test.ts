import {describe, expect, it} from "vitest";
import type {Game, Player} from "@/types";
import {deriveGameState} from "./gameState";

const player = (userId: string, overrides: Partial<Player> = {}): Player => ({
    name: userId.toUpperCase(),
    userId,
    totalScore: 0,
    currentRoundScore: 0,
    hasSubmitted: false,
    pointsHistory: [],
    createdAt: "2026-01-01",
    ...overrides,
});

const game = (players: Player[], overrides: Partial<Game> = {}): Game => ({
    id: "g1",
    players,
    currentDealer: players[0]?.userId ?? "",
    currentRound: 1,
    createdAt: "2026-01-01",
    isFinished: false,
    winner: null,
    winCondition: 1000,
    ...overrides,
});

describe("deriveGameState", () => {
    it("counts submissions and finds the current user and dealer", () => {
        const state = deriveGameState(
            game([player("a", {hasSubmitted: true}), player("b")], {currentDealer: "b"}),
            "a",
        );

        expect(state.submittedCount).toBe(1);
        expect(state.allPlayersSubmitted).toBe(false);
        expect(state.currentUserPlayer?.userId).toBe("a");
        expect(state.hasCurrentUserSubmitted).toBe(true);
        expect(state.currentDealer?.userId).toBe("b");
    });

    it("knows when everyone has submitted", () => {
        const state = deriveGameState(game([player("a", {hasSubmitted: true}), player("b", {hasSubmitted: true})]), "a");

        expect(state.allPlayersSubmitted).toBe(true);
    });

    it("returns the highest total score, including negative totals", () => {
        expect(deriveGameState(game([player("a", {totalScore: 120}), player("b", {totalScore: 300})]), "a").highestTotalScore).toBe(300);
        expect(deriveGameState(game([player("a", {totalScore: -20}), player("b", {totalScore: -5})]), "a").highestTotalScore).toBe(-5);
    });

    it("handles a missing game, an empty game and a user who isn't playing", () => {
        expect(deriveGameState(undefined, "a")).toMatchObject({allPlayersSubmitted: false, submittedCount: 0, highestTotalScore: 0});

        // An empty game must not count as "everyone submitted", or auto-advance would fire
        expect(deriveGameState(game([]), "a")).toMatchObject({allPlayersSubmitted: false, highestTotalScore: 0});

        const spectator = deriveGameState(game([player("b")]), "a");
        expect(spectator.currentUserPlayer).toBeUndefined();
        expect(spectator.hasCurrentUserSubmitted).toBe(false);
    });

    it("knows whether the current user is the lobby admin", () => {
        const players = [player("a"), player("b")];

        expect(deriveGameState(game(players, {ownerId: "a"}), "a").isOwner).toBe(true);
        expect(deriveGameState(game(players, {ownerId: "a"}), "b").isOwner).toBe(false);
        expect(deriveGameState(game(players), "a").isOwner).toBe(false);
    });
});
