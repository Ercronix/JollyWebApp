import {describe, expect, it} from "vitest";
import {fireEvent, render, screen} from "@testing-library/react";
import {RoundTimesChart} from "./index";

const MIN = 60_000;
const stat = (label: string) => screen.getByText(label).nextSibling?.textContent;

// Issue #48: per-round times
describe("RoundTimesChart", () => {
    it("draws a bar per finished round and a live bar", () => {
        const {container} = render(<RoundTimesChart durations={{rounds: [4 * MIN, 2 * MIN, 11 * MIN], liveMs: 3 * MIN}}/>);

        expect(container.querySelectorAll("rect[data-round]")).toHaveLength(4);
        const live = container.querySelectorAll("rect[data-live='true']");
        expect(live).toHaveLength(1);
        expect(live[0].getAttribute("data-round")).toBe("4");
    });

    // Review: Total froze after round 1, so the page no longer showed how long the game has been running
    it("shows total, average, longest and shortest, with the live round in the total", () => {
        render(<RoundTimesChart durations={{rounds: [4 * MIN, 2 * MIN, 11 * MIN], liveMs: 3 * MIN}}/>);

        expect(stat("Total")).toBe("20:00");
        expect(stat("Avg")).toBe("5:40");
        expect(stat("Longest")).toBe("R3 11:00");
        expect(stat("Shortest")).toBe("R2 2:00");
    });

    it("shows the live time as the total while round 1 runs", () => {
        render(<RoundTimesChart durations={{rounds: [], liveMs: 90_000}}/>);

        expect(stat("Total")).toBe("1:30");
        expect(stat("Avg")).toBe("–");
        expect(stat("Longest")).toBe("–");
        expect(stat("Shortest")).toBe("–");
    });

    it("has no average line or live bar for a game that ended in round 1", () => {
        const {container} = render(<RoundTimesChart durations={{rounds: [5 * MIN], liveMs: null}}/>);

        expect(container.querySelectorAll("rect[data-round]")).toHaveLength(1);
        expect(container.querySelector("[data-live]")).toBeNull();
        expect(container.querySelector("line[data-average]")).toBeNull();
    });

    it("draws an average line from two finished rounds", () => {
        const {container} = render(<RoundTimesChart durations={{rounds: [4 * MIN, 2 * MIN], liveMs: null}}/>);

        expect(container.querySelectorAll("line[data-average]")).toHaveLength(1);
    });

    it("renders zero-length rounds without NaN", () => {
        const {container} = render(<RoundTimesChart durations={{rounds: [0, 0], liveMs: 0}}/>);

        const attributes = Array.from(container.querySelectorAll("svg *")).flatMap(el => Array.from(el.attributes));
        expect(attributes.filter(a => a.value.includes("NaN"))).toEqual([]);
    });

    it("thins the round labels for long games", () => {
        const {container} = render(<RoundTimesChart durations={{rounds: Array(40).fill(MIN), liveMs: null}}/>);

        expect(container.querySelectorAll("rect[data-round]")).toHaveLength(40);
        const labels = Array.from(container.querySelectorAll("svg text")).filter(el => /^R\d+$/.test(el.textContent ?? ""));
        expect(labels.length).toBeLessThanOrEqual(6);
    });

    // Review: four stats in a row truncated values like "R12 11:20" on phones
    it("puts the stats in two columns on phones", () => {
        render(<RoundTimesChart durations={{rounds: [4 * MIN], liveMs: null}}/>);

        const row = screen.getByText("Total").closest(".grid")!;
        expect(row.className).toContain("grid-cols-2");
        expect(row.className).toContain("sm:grid-cols-4");
    });

    it("says when round times weren't recorded", () => {
        const {container} = render(<RoundTimesChart durations={null}/>);

        expect(screen.getByText("Round times weren't recorded for this game.")).toBeTruthy();
        expect(container.querySelector("svg")).toBeNull();
    });

    it("shows a round's time on hover", () => {
        const {container} = render(<RoundTimesChart durations={{rounds: [4 * MIN, 2 * MIN, 11 * MIN], liveMs: null}}/>);

        fireEvent.mouseEnter(container.querySelector("rect[data-round='3']")!);

        expect(screen.getByText("Round 3")).toBeTruthy();
        expect(screen.getByText("11:00")).toBeTruthy();
    });
});
