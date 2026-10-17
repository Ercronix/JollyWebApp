import {describe, expect, it, vi} from "vitest";
import {render, screen} from "@testing-library/react";
import {AdminPanel} from "./index";
import {ToastContext} from "@/presentation/components/Toast/useToast";
import type {Player} from "@/types";

const player: Player = {
    name: "Bob", userId: "bob", totalScore: 30, currentRoundScore: 0, hasSubmitted: false,
    pointsHistory: [10, 20], createdAt: "2026-01-01",
};

const props = {
    players: [player], onAddPlayer: vi.fn(), onRemovePlayer: vi.fn(), onSubmitScoreForPlayer: vi.fn(),
    currentRound: 3, isFinished: false,
};

const renderPanel = (isAdminMode: boolean) => render(
    <ToastContext.Provider value={{error: vi.fn(), success: vi.fn()}}>
        <AdminPanel {...props} isAdminMode={isAdminMode}/>
    </ToastContext.Provider>
);

// Admin mode is switched on in the game settings, so the panel has no toggle of its own
describe("AdminPanel", () => {
    it("renders nothing while admin mode is off", () => {
        const {container} = renderPanel(false);
        expect(container.innerHTML).toBe("");
    });

    it("shows the admin controls without a toggle when admin mode is on", () => {
        renderPanel(true);
        screen.getByText("Admin Controls");
        expect(screen.queryByRole("button", {name: /admin mode/i})).toBeNull();
    });
});
