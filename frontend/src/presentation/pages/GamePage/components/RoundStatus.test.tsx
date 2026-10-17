import {describe, expect, it} from "vitest";
import {render, screen} from "@testing-library/react";
import {RoundStatus} from "./RoundStatus";

const props = {
    submittedCount: 1,
    totalPlayers: 3,
    allPlayersSubmitted: false,
    hasCurrentUserSubmitted: true,
};

describe("RoundStatus", () => {
    it("offers no way to skip missing scores while waiting", () => {
        render(<RoundStatus {...props}/>);

        expect(screen.queryByRole("button", {name: "Skip missing scores"})).toBeNull();
        expect(screen.getByText("Submitted · waiting · 1 of 3")).toBeTruthy();
    });
});
