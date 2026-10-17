import {describe, expect, it, vi} from "vitest";
import {fireEvent, render, screen} from "@testing-library/react";
import type {Game, Lobby, Player} from "@/types";
import {LobbyCard} from "./HistoryPage";

const player = (userId: string, name: string, pointsHistory: number[]): Player => ({
    userId, name, pointsHistory, totalScore: pointsHistory.reduce((a, b) => a + b, 0),
    currentRoundScore: 0, hasSubmitted: false, createdAt: "2026-01-01",
});

const game: Game = {
    id: "g1",
    players: [player("a", "Anna", [10, 20]), player("b", "Bob", [5, 15])],
    currentDealer: "a",
    currentRound: 3,
    createdAt: "2026-01-01",
    isFinished: false,
    winner: null,
    winCondition: 1000,
};

vi.mock("@/core/api/hooks", () => ({
    useGameState: (gameId: string | undefined) => ({data: gameId ? game : undefined, isLoading: false}),
}));

const lobby: Lobby = {id: "l1", name: "Friday", playerCount: 2, createdAt: "2026-01-01", gameId: "g1"};

describe("LobbyCard", () => {
    // Issue #47: the score graph should also be shown in the history details
    it("shows the score graph in the expanded details", () => {
        render(<LobbyCard lobby={lobby} onDelete={vi.fn()}/>);

        fireEvent.click(screen.getByRole("button", {name: /Friday/}));

        const legend = screen.getByRole("list", {name: "Players"});
        expect(Array.from(legend.querySelectorAll("li")).map(li => li.textContent)).toEqual(["♠ Anna", "♥ Bob"]);
    });
});
