import {describe, expect, it, vi} from "vitest";
import {fireEvent, render, screen} from "@testing-library/react";
import {ScoreInput} from "./ScoreInput";

const props = {
    tempScore: "35", isPending: false, roundNumber: 3,
    onScoreInput: vi.fn(), onCalculatorOpen: vi.fn(), onSubmit: vi.fn(),
};

describe("ScoreInput", () => {
    it("uses the numeric keyboard and labels the input", () => {
        render(<ScoreInput {...props}/>);

        expect(screen.getByLabelText("Your score, round 3").getAttribute("inputmode")).toBe("numeric");
    });

    it("flips the sign with the ± button", () => {
        const onScoreInput = vi.fn();
        render(<ScoreInput {...props} onScoreInput={onScoreInput}/>);

        fireEvent.click(screen.getByRole("button", {name: "Toggle minus"}));

        expect(onScoreInput).toHaveBeenCalledWith("-35");
    });
});
