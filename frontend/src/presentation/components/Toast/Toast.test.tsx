import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {act, fireEvent, render, screen} from "@testing-library/react";
import {ToastProvider} from ".";
import {useToast} from "./useToast";

function Trigger({message, kind = "error"}: {message: string; kind?: "error" | "success"}) {
    const toast = useToast();
    return <button onClick={() => toast[kind](message)}>show</button>;
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("Toast", () => {
    it("shows a message as an alert without blocking the page", () => {
        render(<ToastProvider><Trigger message="Failed to add player"/></ToastProvider>);

        fireEvent.click(screen.getByText("show"));

        expect(screen.getByRole("alert").textContent).toContain("Failed to add player");
    });

    it("disappears after a few seconds", () => {
        render(<ToastProvider><Trigger message="Saved" kind="success"/></ToastProvider>);
        fireEvent.click(screen.getByText("show"));

        act(() => {
            vi.advanceTimersByTime(5000);
        });

        expect(screen.queryByText("Saved")).toBeNull();
    });

    it("can be dismissed", () => {
        render(<ToastProvider><Trigger message="Oops"/></ToastProvider>);
        fireEvent.click(screen.getByText("show"));

        fireEvent.click(screen.getByLabelText("Dismiss"));

        expect(screen.queryByText("Oops")).toBeNull();
    });

    it("stacks several messages", () => {
        render(<ToastProvider><Trigger message="One"/></ToastProvider>);

        fireEvent.click(screen.getByText("show"));
        fireEvent.click(screen.getByText("show"));

        expect(screen.getAllByText("One")).toHaveLength(2);
    });
});
