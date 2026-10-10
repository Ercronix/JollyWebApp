import {describe, expect, it, vi} from "vitest";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {PlayerHistoryModal} from ".";
import type {Player} from "@/types";

const bob: Player = {
    name: "Bob", userId: "bob", totalScore: 30, currentRoundScore: 0, hasSubmitted: false,
    pointsHistory: [10, 20], createdAt: "2026-01-01",
};

const baseProps = {isOpen: true, onClose: vi.fn(), player: bob, currentUserId: "alice", gameId: "g1"};

describe("PlayerHistoryModal", () => {
    it("does not let players edit someone else's history", () => {
        render(<PlayerHistoryModal {...baseProps} onUpdateScore={vi.fn()}/>);

        expect(screen.queryByRole("button", {name: "Edit"})).toBeNull();
    });

    it("lets the admin edit someone else's history", async () => {
        const onUpdateScore = vi.fn().mockResolvedValue(undefined);
        render(<PlayerHistoryModal {...baseProps} canEditOthers onUpdateScore={onUpdateScore}/>);

        fireEvent.click(screen.getAllByRole("button", {name: "Edit"})[1]);
        fireEvent.change(screen.getByDisplayValue("20"), {target: {value: "25"}});
        fireEvent.click(screen.getByRole("button", {name: "Save"}));

        await waitFor(() => expect(onUpdateScore).toHaveBeenCalledWith(1, 25));
    });
});
