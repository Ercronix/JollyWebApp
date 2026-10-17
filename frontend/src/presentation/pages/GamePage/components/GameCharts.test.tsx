import {afterEach, describe, expect, it, vi} from "vitest";
import {fireEvent, render, screen} from "@testing-library/react";
import {GameCharts} from "./GameCharts";
import type {Game, Player} from "@/types";

const player = (userId: string, name: string, pointsHistory: number[]): Player => ({
    userId, name, pointsHistory, totalScore: pointsHistory.reduce((a, b) => a + b, 0),
    currentRoundScore: 0, hasSubmitted: false, createdAt: "2026-01-01",
});

const game: Game = {
    id: "g1",
    players: [player("a", "Anna", [10, 20]), player("b", "Bob", [5, 15])],
    currentDealer: "a",
    currentRound: 3,
    createdAt: "2026-01-01T12:00:00.000Z",
    roundEndedAt: ["2026-01-01T12:04:00.000Z", "2026-01-01T12:06:00.000Z"],
    isFinished: false,
    winner: null,
    winCondition: 1000,
};

// Issue #48: the round times sit next to the points history
describe("GameCharts", () => {
    const originalScrollTo = HTMLElement.prototype.scrollTo;
    afterEach(() => {
        HTMLElement.prototype.scrollTo = originalScrollTo;
    });

    it("shows the points history and the round times side by side", () => {
        render(<GameCharts game={game}/>);

        expect(screen.getByText("Points History")).toBeTruthy();
        expect(screen.getByText("Round Times")).toBeTruthy();
    });

    it("labels the page dots and marks the first as current", () => {
        render(<GameCharts game={game}/>);

        expect(screen.getByRole("button", {name: "Points history"}).getAttribute("aria-current")).toBe("true");
        expect(screen.getByRole("button", {name: "Round times"}).getAttribute("aria-current")).toBeNull();
    });

    it("switches to the round times on clicking its dot", () => {
        const scrollTo = vi.fn();
        HTMLElement.prototype.scrollTo = scrollTo;
        render(<GameCharts game={game}/>);

        fireEvent.click(screen.getByRole("button", {name: "Round times"}));

        expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({left: expect.any(Number)}));
        expect(screen.getByRole("button", {name: "Round times"}).getAttribute("aria-current")).toBe("true");
    });
});
