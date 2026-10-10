import {describe, expect, it, vi} from "vitest";
import {fireEvent, render, screen} from "@testing-library/react";
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

// Review finding: without a way to force the round, an absent admin could block the game
describe("RoundStatus", () => {
    it("lets players skip missing scores while waiting", () => {
        const onForceNextRound = vi.fn();
        render(<RoundStatus {...props} onForceNextRound={onForceNextRound}/>);

        fireEvent.click(screen.getByRole("button", {name: "Skip missing scores"}));

        expect(onForceNextRound).toHaveBeenCalledOnce();
    });

    it("hides the skip button once everyone submitted", () => {
        render(<RoundStatus {...props} submittedCount={3} allPlayersSubmitted onForceNextRound={vi.fn()}/>);

        expect(screen.queryByRole("button", {name: "Skip missing scores"})).toBeNull();
    });
});
