import {describe, expect, it} from "vitest";
import {render, screen} from "@testing-library/react";
import {WinnerCard} from "./WinnerCard";
import type {Player} from "@/types";

const player = (userId: string, name: string, totalScore: number): Player => ({
    userId, name, totalScore, currentRoundScore: 0, hasSubmitted: false, createdAt: "2026-01-01",
});

const players = [player("a", "Anna", 905), player("m", "Maximilian", 1015), player("t", "Tim", 870)];

describe("WinnerCard", () => {
    it("shows the winner's name and final total", () => {
        render(<WinnerCard winner="m" players={players}/>);

        const card = screen.getByRole("status");
        expect(card.textContent).toContain("Game over");
        expect(card.textContent).toContain("Maximilian");
        expect(card.textContent).toContain("1015");
    });

    it("wears the winner's seat suit", () => {
        render(<WinnerCard winner="m" players={players}/>);

        // Maximilian sits second, so hearts
        expect(screen.getAllByText("♥").length).toBeGreaterThan(0);
    });

    it("still announces the end when the winner is unknown", () => {
        render(<WinnerCard winner={null} players={players}/>);

        expect(screen.getByRole("status").textContent).toContain("Game over");
    });
});
