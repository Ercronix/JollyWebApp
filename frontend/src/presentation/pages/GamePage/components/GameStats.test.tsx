import {describe, expect, it} from "vitest";
import {render, screen} from "@testing-library/react";
import {GameStats} from "./GameStats";

describe("GameStats", () => {
    // Issue #48: the running time moved from the stats into the round times chart
    it("no longer shows a Time tile", () => {
        render(<GameStats currentRound={3} winCondition={1000} dealerName="Anna"/>);

        expect(screen.queryByText("Time")).toBeNull();
        expect(screen.getByText("Round")).toBeTruthy();
    });
});
