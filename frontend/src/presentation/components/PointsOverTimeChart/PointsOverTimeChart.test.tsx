import {describe, expect, it} from "vitest";
import {fireEvent, render, screen} from "@testing-library/react";
import {PointsOverTimeChart} from "./index";
import type {Player} from "@/types";

const MIN = 60_000;

const player = (userId: string, name: string, pointsHistory: number[]): Player => ({
    userId, name, pointsHistory, totalScore: pointsHistory.reduce((a, b) => a + b, 0),
    currentRoundScore: 0, hasSubmitted: false, createdAt: "2026-01-01",
});

// The x coordinates of a line's points, from its "M x y L x y ..." path
const pathXs = (path: Element) =>
    (path.getAttribute("d") ?? "").match(/[ML] [\d.-]+/g)!.map(s => Number(s.slice(2)));

const bandWidths = (container: HTMLElement) =>
    Array.from(container.querySelectorAll("rect[data-band]")).map(b => Number(b.getAttribute("width")));

// Scores and round times in one graph: the points race on a time axis
describe("PointsOverTimeChart", () => {
    it("places each round's points where the round ended", () => {
        const {container} = render(<PointsOverTimeChart players={[player("a", "Anna", [10, 20, 30])]}
                                                        durations={{rounds: [4 * MIN, 2 * MIN, 6 * MIN], liveMs: null}}/>);

        const [x0, x1, x2, x3] = pathXs(container.querySelector("svg path")!);
        expect((x1 - x0) / (x3 - x0)).toBeCloseTo(4 / 12);
        expect((x2 - x0) / (x3 - x0)).toBeCloseTo(6 / 12);
    });

    it("stretches the time axis over the game so far", () => {
        const {container} = render(<PointsOverTimeChart players={[player("a", "Anna", [10, 20, 30])]}
                                                        durations={{rounds: [4 * MIN, 2 * MIN, 11 * MIN], liveMs: null}}/>);

        const gridRight = Number(container.querySelector("svg line")!.getAttribute("x2"));
        expect(pathXs(container.querySelector("svg path")!).at(-1)).toBeCloseTo(gridRight);
    });

    it("draws a band per round, as wide as the round took", () => {
        const {container} = render(<PointsOverTimeChart players={[player("a", "Anna", [10, 20, 30])]}
                                                        durations={{rounds: [4 * MIN, 2 * MIN, 6 * MIN], liveMs: null}}/>);

        const [w1, w2, w3] = bandWidths(container);
        expect(w1 / w2).toBeCloseTo(2);
        expect(w3 / w2).toBeCloseTo(3);
    });

    it("grows a live band for the round still running", () => {
        const {container} = render(<PointsOverTimeChart players={[player("a", "Anna", [10, 20])]}
                                                        durations={{rounds: [4 * MIN, 2 * MIN], liveMs: 3 * MIN}}/>);

        const bands = container.querySelectorAll("rect[data-band]");
        expect(bands).toHaveLength(3);
        expect(bands[2].getAttribute("data-live")).toBe("true");
        expect(bandWidths(container)[2] / bandWidths(container)[1]).toBeCloseTo(1.5);
        // The line ends at the last finished round
        expect(pathXs(container.querySelector("svg path")!)).toHaveLength(3);
    });

    it("has nothing to plot before the first round ends", () => {
        const {container} = render(<PointsOverTimeChart players={[player("a", "Anna", [])]}
                                                        durations={{rounds: [], liveMs: 0}}/>);

        expect(container.querySelectorAll("rect[data-band]")).toHaveLength(1);
        expect(container.querySelector("svg path")).toBeNull();
        const attributes = Array.from(container.querySelectorAll("svg *")).flatMap(el => Array.from(el.attributes));
        expect(attributes.filter(a => a.value.includes("NaN"))).toEqual([]);
    });

    it("shows the round's time and the player's points on hover", () => {
        const {container} = render(<PointsOverTimeChart players={[player("a", "Anna", [10, 20])]}
                                                        durations={{rounds: [4 * MIN, 2 * MIN], liveMs: null}}/>);

        fireEvent.mouseEnter(container.querySelectorAll("svg circle")[1]);

        expect(screen.getByText("Round 2 · 2:00")).toBeTruthy();
        expect(screen.getByText("Anna: 30 pts")).toBeTruthy();
    });

    it("labels each line with the player's seat suit", () => {
        render(<PointsOverTimeChart players={[player("a", "Anna", [10]), player("b", "Bob", [5])]}
                                    durations={{rounds: [MIN], liveMs: null}}/>);

        const legend = screen.getByRole("list", {name: "Players"});
        expect(Array.from(legend.querySelectorAll("li")).map(li => li.textContent)).toEqual(["♠ Anna", "♥ Bob"]);
    });

    it("says when round times weren't recorded", () => {
        const {container} = render(<PointsOverTimeChart players={[player("a", "Anna", [10])]} durations={null}/>);

        expect(screen.getByText("Round times weren't recorded for this game.")).toBeTruthy();
        expect(container.querySelector("svg")).toBeNull();
    });
});
