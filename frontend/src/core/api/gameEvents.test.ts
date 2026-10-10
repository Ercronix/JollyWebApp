import {describe, expect, it} from "vitest";
import type {Game} from "@/types";
import {mergeEventGame} from "./gameEvents";

const game = (overrides: Partial<Game> = {}): Game => ({
    id: "g1",
    players: [],
    currentDealer: "a",
    currentRound: 1,
    createdAt: "2026-01-01",
    isFinished: false,
    winner: null,
    winCondition: 1000,
    ...overrides,
});

describe("mergeEventGame", () => {
    it("keeps the cached owner when the event's game has none", () => {
        const merged = mergeEventGame(game({ownerId: "a"}), game({currentRound: 2}));

        expect(merged).toMatchObject({ownerId: "a", currentRound: 2});
    });

    it("keeps the cached lobby players when the event's game has none", () => {
        expect(mergeEventGame(game({lobbyPlayerIds: ["a"]}), game()).lobbyPlayerIds).toEqual(["a"]);
    });

    it("prefers the event's owner when it has one", () => {
        expect(mergeEventGame(game({ownerId: "a"}), game({ownerId: "b"})).ownerId).toBe("b");
    });

    it("returns the event's game when nothing is cached", () => {
        const incoming = game({currentRound: 3});

        expect(mergeEventGame(undefined, incoming)).toEqual(incoming);
    });
});
