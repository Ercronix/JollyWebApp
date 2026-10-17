import {describe, expect, it, vi} from "vitest";
import {fireEvent, render, screen} from "@testing-library/react";
import type {Game, Lobby} from "@/types";
import {LobbyCard} from "./HistoryPage";

let game: Game;

vi.mock("@/core/api/hooks", () => ({
    useGameState: (gameId: string | undefined) => ({data: gameId ? game : undefined, isLoading: false}),
}));

const baseGame: Game = {
    id: "g1",
    players: [],
    currentDealer: "a",
    currentRound: 5,
    createdAt: "2026-01-01T20:00:00Z",
    isFinished: true,
    winner: null,
    winCondition: 1000,
};

const lobby: Lobby = {id: "l1", name: "Friday", playerCount: 2, createdAt: "2026-01-01", gameId: "g1"};

const expand = () => {
    render(<LobbyCard lobby={lobby} onDelete={vi.fn()}/>);
    fireEvent.click(screen.getByRole("button", {name: /Friday/}));
};

// Issue #48: how long the game ran
describe("LobbyCard duration", () => {
    it("shows how long a finished game took", () => {
        game = {...baseGame, finishedAt: "2026-01-01T21:23:45Z"};
        expand();

        expect(screen.getByText("Duration").nextSibling?.textContent).toBe("1:23:45");
    });

    it("leaves it out when the end time is unknown", () => {
        game = {...baseGame, finishedAt: null};
        expand();

        expect(screen.queryByText("Duration")).toBeNull();
    });
});
