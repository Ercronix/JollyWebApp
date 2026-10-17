import {describe, expect, it, vi} from "vitest";
import {fireEvent, render, screen} from "@testing-library/react";
import {PlayerCard} from "./PlayerCard";
import type {Player} from "@/types";

const player: Player = {
    name: "Bob", userId: "bob", totalScore: 30, currentRoundScore: 0, hasSubmitted: false,
    pointsHistory: [10, 20], createdAt: "2026-01-01",
};

const props = {
    player, index: 1, playerCount: 3, isCurrentUser: false, isDealer: false, isFinished: false,
    showReorderMode: true, onMove: vi.fn(), onClick: vi.fn(),
};

// HTML5 drag and drop doesn't fire on touch screens, so reordering uses buttons
describe("PlayerCard reorder mode", () => {
    it("moves the player up or down", () => {
        const onMove = vi.fn();
        render(<PlayerCard {...props} onMove={onMove}/>);

        fireEvent.click(screen.getByRole("button", {name: "Move Bob up"}));
        fireEvent.click(screen.getByRole("button", {name: "Move Bob down"}));

        expect(onMove.mock.calls).toEqual([[1, 0], [1, 2]]);
    });

    it("can't move the first player up or the last one down", () => {
        const {rerender} = render(<PlayerCard {...props} index={0}/>);
        expect((screen.getByRole("button", {name: "Move Bob up"}) as HTMLButtonElement).disabled).toBe(true);

        rerender(<PlayerCard {...props} index={2}/>);
        expect((screen.getByRole("button", {name: "Move Bob down"}) as HTMLButtonElement).disabled).toBe(true);
    });

    it("opens the history outside reorder mode", () => {
        const onClick = vi.fn();
        render(<PlayerCard {...props} showReorderMode={false} onClick={onClick}/>);

        fireEvent.click(screen.getByRole("button", {name: /Bob/}));

        expect(onClick).toHaveBeenCalledOnce();
        expect(screen.queryByRole("button", {name: "Move Bob up"})).toBeNull();
    });
});

describe("PlayerCard as a playing card", () => {
    const cardProps = {...props, showReorderMode: false};

    it("shows the seat number and the seat's suit in the corner", () => {
        render(<PlayerCard {...cardProps} index={1}/>);

        expect(screen.getByText("2")).toBeTruthy();
        expect(screen.getByText("♥")).toBeTruthy();
    });

    it("marks the dealer with a dealer button instead of a badge", () => {
        render(<PlayerCard {...cardProps} isDealer/>);

        expect(screen.getByRole("img", {name: "Dealer"}).textContent).toBe("D");
    });

    it("shows no dealer button for other players", () => {
        render(<PlayerCard {...cardProps}/>);

        expect(screen.queryByRole("img", {name: "Dealer"})).toBeNull();
    });
});

// Regression: an admin-removed player who scored stays in the game with their points
describe("PlayerCard for a removed player", () => {
    it("marks them as left instead of submitted", () => {
        render(<PlayerCard {...props} showReorderMode={false}
                           player={{...player, hasSubmitted: true, hasLeft: true}}/>);

        expect(screen.getByText("Left")).toBeTruthy();
        expect(screen.queryByText(/Submitted/)).toBeNull();
        expect(screen.getByText("30")).toBeTruthy();
    });
});
