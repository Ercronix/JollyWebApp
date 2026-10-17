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

    it("shows the points history, the round times and the points over time side by side", () => {
        render(<GameCharts game={game}/>);

        expect(screen.getByText("Points History")).toBeTruthy();
        expect(screen.getByText("Round Times")).toBeTruthy();
        expect(screen.getByText("Points Over Time")).toBeTruthy();
        expect(screen.getByRole("button", {name: "Points over time"})).toBeTruthy();
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

    // Regression: the smooth scroll after a dot click passed the halfway point late, so the
    // active dot jumped back to the first page before settling on the second
    it("keeps the clicked dot current while the panel scrolls to it", () => {
        HTMLElement.prototype.scrollTo = vi.fn();
        const {container} = render(<GameCharts game={game}/>);
        const scroller = container.querySelector(".snap-x") as HTMLElement;
        Object.defineProperty(scroller, "clientWidth", {value: 390});
        const roundTimes = screen.getByRole("button", {name: "Round times"});

        fireEvent.click(roundTimes);
        scroller.scrollLeft = 100;
        fireEvent.scroll(scroller);

        expect(roundTimes.getAttribute("aria-current")).toBe("true");
    });

    it("follows the swipe again once the scroll has ended", () => {
        HTMLElement.prototype.scrollTo = vi.fn();
        const {container} = render(<GameCharts game={game}/>);
        const scroller = container.querySelector(".snap-x") as HTMLElement;
        Object.defineProperty(scroller, "clientWidth", {value: 390});

        fireEvent.click(screen.getByRole("button", {name: "Round times"}));
        scroller.scrollLeft = 390;
        fireEvent(scroller, new Event("scrollend"));
        scroller.scrollLeft = 0;
        fireEvent.scroll(scroller);

        expect(screen.getByRole("button", {name: "Points history"}).getAttribute("aria-current")).toBe("true");
    });

    // Browsers without scrollend (older iOS Safari) must not leave the dots stuck after a click
    it("follows the swipe again once the panel reaches the clicked page", () => {
        HTMLElement.prototype.scrollTo = vi.fn();
        const {container} = render(<GameCharts game={game}/>);
        const scroller = container.querySelector(".snap-x") as HTMLElement;
        Object.defineProperty(scroller, "clientWidth", {value: 390});

        fireEvent.click(screen.getByRole("button", {name: "Round times"}));
        scroller.scrollLeft = 390;
        fireEvent.scroll(scroller);
        scroller.scrollLeft = 0;
        fireEvent.scroll(scroller);

        expect(screen.getByRole("button", {name: "Points history"}).getAttribute("aria-current")).toBe("true");
    });

    it("still follows the swipe after clicking the current page's dot", () => {
        HTMLElement.prototype.scrollTo = vi.fn();
        const {container} = render(<GameCharts game={game}/>);
        const scroller = container.querySelector(".snap-x") as HTMLElement;
        Object.defineProperty(scroller, "clientWidth", {value: 390});

        fireEvent.click(screen.getByRole("button", {name: "Points history"}));
        scroller.scrollLeft = 300;
        fireEvent.scroll(scroller);

        expect(screen.getByRole("button", {name: "Round times"}).getAttribute("aria-current")).toBe("true");
    });
});
