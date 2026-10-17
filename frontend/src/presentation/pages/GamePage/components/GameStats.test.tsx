import {describe, expect, it} from "vitest";
import {render, screen} from "@testing-library/react";
import {GameStats} from "./GameStats";

// Issue #48: how long the game is running
describe("GameStats", () => {
    it("shows the game's running time", () => {
        render(<GameStats currentRound={3} winCondition={1000} dealerName="Anna" elapsedMs={754_000}/>);

        expect(screen.getByText("Time").nextSibling?.textContent).toBe("12:34");
    });
});
