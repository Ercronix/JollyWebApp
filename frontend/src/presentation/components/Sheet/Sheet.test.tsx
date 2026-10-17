import {describe, expect, it, vi} from "vitest";
import {fireEvent, render, screen} from "@testing-library/react";
import {Sheet} from ".";

describe("Sheet", () => {
    it("renders nothing while closed", () => {
        render(<Sheet isOpen={false} onClose={vi.fn()} title="History">Rounds</Sheet>);

        expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("is a modal dialog named by its title", () => {
        render(<Sheet isOpen onClose={vi.fn()} title="History">Rounds</Sheet>);

        const dialog = screen.getByRole("dialog", {name: "History"});
        expect(dialog.getAttribute("aria-modal")).toBe("true");
        expect(screen.getByText("Rounds")).toBeTruthy();
    });

    it("closes on Escape, the backdrop and the close button", () => {
        const onClose = vi.fn();
        render(<Sheet isOpen onClose={onClose} title="History">Rounds</Sheet>);

        fireEvent.keyDown(document, {key: "Escape"});
        fireEvent.click(screen.getByTestId("sheet-backdrop"));
        fireEvent.click(screen.getByRole("button", {name: "Close"}));

        expect(onClose).toHaveBeenCalledTimes(3);
    });

    it("does not close when tapping inside", () => {
        const onClose = vi.fn();
        render(<Sheet isOpen onClose={onClose} title="History">Rounds</Sheet>);

        fireEvent.click(screen.getByText("Rounds"));

        expect(onClose).not.toHaveBeenCalled();
    });
});
