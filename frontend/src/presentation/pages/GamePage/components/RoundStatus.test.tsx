import {describe, expect, it, vi} from "vitest";
import {render, screen} from "@testing-library/react";
import {RoundStatus} from "./RoundStatus";

const props = {
    submittedCount: 1,
    totalPlayers: 3,
    allPlayersSubmitted: false,
    hasCurrentUserSubmitted: true,
    autoAdvance: false,
    isPending: false,
    onNextRound: vi.fn(),
};

describe("RoundStatus", () => {
    it("offers no way to skip missing scores while waiting", () => {
        render(<RoundStatus {...props}/>);

        expect(screen.queryByRole("button", {name: "Skip missing scores"})).toBeNull();
        expect(screen.getByText("⏳ Waiting for scores (1/3)")).toBeTruthy();
    });
});
