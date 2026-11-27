import {describe, expect, it, vi} from "vitest";
import {fireEvent, render, screen} from "@testing-library/react";
import type {Game, Lobby, Player} from "@/types";
import {LobbyCard} from "./HistoryPage";

let game: Game;

vi.mock("@/core/api/hooks", () => ({
    useGameState: (gameId: string | undefined) => ({data: gameId ? game : undefined, isLoading: false}),
}));

const player = (userId: string, name: string, pointsHistory: number[]): Player => ({
    userId, name, pointsHistory, totalScore: pointsHistory.reduce((a, b) => a + b, 0),
    currentRoundScore: 0, hasSubmitted: false, createdAt: "2026-01-01",
});

const baseGame: Game = {
    id: "g1",
    players: [player("a", "Anna", [10, 20]), player("b", "Bob", [5, 15])],
    currentDealer: "a",
    currentRound: 2,
    createdAt: "2026-01-01T20:00:00.000Z",
    roundEndedAt: ["2026-01-01T20:04:00.000Z", "2026-01-01T20:06:00.000Z"],
    isFinished: true,
    winner: "a",
    winCondition: 1000,
};

const lobby: Lobby = {id: "l1", name: "Friday", playerCount: 2, createdAt: "2026-01-01", gameId: "g1"};

const expand = (shown: Lobby = lobby) => {
    const result = render(<LobbyCard lobby={shown} onDelete={vi.fn()}/>);
    fireEvent.click(screen.getByRole("button", {name: /Friday/}));
    return result;
};

// Issue #67: the history should offer the other charts of the game page too, including the round times
describe("LobbyCard charts", () => {
    it("shows the points history, the round times and the points over time", () => {
        game = baseGame;
        expand();

        expect(screen.getByText("Points History")).toBeTruthy();
        expect(screen.getByText("Round Times")).toBeTruthy();
        expect(screen.getByText("Points Over Time")).toBeTruthy();
        expect(screen.getByText("Total").nextSibling?.textContent).toBe("6:00");
    });

    it("does not count a round still running in a game abandoned unfinished", () => {
        game = {...baseGame, currentRound: 3, isFinished: false, winner: null};
        const {container} = expand({...lobby, archived: true});

        expect(container.querySelectorAll("rect[data-round]")).toHaveLength(2);
        expect(container.querySelector("[data-live]")).toBeNull();
        expect(screen.getByText("Total").nextSibling?.textContent).toBe("6:00");
    });

    it("keeps timing the current round of a game still being played", () => {
        game = {...baseGame, currentRound: 3, isFinished: false, winner: null};
        const {container} = expand();

        expect(container.querySelector("rect[data-live='true'][data-round='3']")).not.toBeNull();
    });
});
