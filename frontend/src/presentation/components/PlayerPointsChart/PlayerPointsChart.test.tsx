import {describe, expect, it} from "vitest";
import {fireEvent, render, screen} from "@testing-library/react";
import {PlayerPointsChart} from "./index";
import type {Player} from "@/types";

const player = (userId: string, name: string, pointsHistory: number[]): Player => ({
    userId, name, pointsHistory, totalScore: pointsHistory.reduce((a, b) => a + b, 0),
    currentRoundScore: 0, hasSubmitted: false, createdAt: "2026-01-01",
});

describe("PlayerPointsChart", () => {
    it("labels each line with the player's seat suit, matching their card", () => {
        render(<PlayerPointsChart currentRound={3} players={[
            player("a", "Anna", [10, 20]),
            player("b", "Bob", [5, 15]),
        ]}/>);

        const legend = screen.getByRole("list", {name: "Players"});
        expect(Array.from(legend.querySelectorAll("li")).map(li => li.textContent)).toEqual(["♠ Anna", "♥ Bob"]);
    });

    it("draws one line per player who has played a round", () => {
        const {container} = render(<PlayerPointsChart currentRound={3} players={[
            player("a", "Anna", [10, 20]),
            player("b", "Bob", [5, 15]),
        ]}/>);

        expect(container.querySelectorAll("svg path")).toHaveLength(2);
    });

    // Regression: the tooltip was always drawn to the right of the point, so the last round's
    // tooltip ended up past the chart's right edge and was cut off.
    it("keeps the tooltip inside the chart for the last round", () => {
        const {container} = render(<PlayerPointsChart currentRound={3} players={[player("a", "Anna", [10, 20])]}/>);
        const svg = container.querySelector("svg")!;
        const chartWidth = Number(svg.getAttribute("viewBox")!.split(" ")[2]);
        const circles = container.querySelectorAll("circle");

        fireEvent.mouseEnter(circles[circles.length - 1]);

        const tooltip = container.querySelector("rect")!;
        expect(Number(tooltip.getAttribute("x")) + Number(tooltip.getAttribute("width"))).toBeLessThanOrEqual(chartWidth);
    });

    // Issue #48: per-round times
    it("shows how long the round took in the tooltip", () => {
        const {container} = render(<PlayerPointsChart currentRound={3} players={[player("a", "Anna", [10, 20])]}
                                                      roundDurations={[250_000, 60_000]}/>);

        fireEvent.mouseEnter(container.querySelectorAll("circle")[0]);

        expect(screen.getByText("Round 1 · 4:10")).toBeTruthy();
    });

    it("shows just the round without round times", () => {
        const {container} = render(<PlayerPointsChart currentRound={3} players={[player("a", "Anna", [10, 20])]}/>);

        fireEvent.mouseEnter(container.querySelectorAll("circle")[0]);

        expect(screen.getByText("Round 1")).toBeTruthy();
    });
});
