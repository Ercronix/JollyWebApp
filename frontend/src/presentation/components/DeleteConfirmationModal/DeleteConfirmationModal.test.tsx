import {describe, expect, it, vi} from "vitest";
import {fireEvent, render, screen} from "@testing-library/react";
import {DeleteConfirmationModal} from ".";

const baseProps = {isOpen: true, title: "Delete Lobby?", message: "Are you sure you want to delete", onConfirm: vi.fn(), onCancel: vi.fn()};

describe("DeleteConfirmationModal", () => {
    it("defaults to a Delete button", () => {
        render(<DeleteConfirmationModal {...baseProps}/>);

        expect(screen.getByRole("button", {name: "Delete"})).toBeTruthy();
    });

    it("supports a custom confirm label and an extra action", () => {
        const onExtra = vi.fn();
        render(
            <DeleteConfirmationModal
                {...baseProps}
                confirmLabel="Log out anyway"
                extraAction={{label: "Set password", onClick: onExtra}}
            />,
        );

        fireEvent.click(screen.getByRole("button", {name: "Set password"}));

        expect(screen.getByRole("button", {name: "Log out anyway"})).toBeTruthy();
        expect(onExtra).toHaveBeenCalledOnce();
    });
});
