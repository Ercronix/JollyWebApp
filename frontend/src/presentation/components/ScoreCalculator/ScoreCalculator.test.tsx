import {beforeEach, describe, expect, it, vi} from "vitest";
import {fireEvent, render, screen} from "@testing-library/react";

const fireworks = vi.hoisted(() => ({start: vi.fn(), stop: vi.fn()}));
vi.mock("fireworks-js", () => ({
    Fireworks: vi.fn(function Fireworks() {
        return fireworks;
    }),
}));

import {ScoreCalculator} from ".";

function renderCalculator(isOpen: boolean) {
    return (
        <ScoreCalculator isOpen={isOpen} onClose={() => {}} onSubmit={() => {}} playerName="Ann"/>
    );
}

beforeEach(() => {
    fireworks.start.mockClear();
    fireworks.stop.mockClear();
});

describe("ScoreCalculator", () => {
    it("starts from zero again when reopened", () => {
        const {rerender} = render(renderCalculator(true));
        fireEvent.click(screen.getByText("+25"));
        fireEvent.click(screen.getByRole("checkbox"));
        expect(screen.getByText("75")).toBeTruthy();

        rerender(renderCalculator(false));
        rerender(renderCalculator(true));

        expect(screen.getByText("0")).toBeTruthy();
        expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(false);
    });

    it("stops the fireworks when closed after a won round", () => {
        const {rerender} = render(renderCalculator(true));
        fireEvent.click(screen.getByRole("checkbox"));
        expect(fireworks.start).toHaveBeenCalledTimes(1);

        rerender(renderCalculator(false));

        expect(fireworks.stop).toHaveBeenCalled();
    });
});
