import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {act, renderHook} from "@testing-library/react";
import {useAutoAdvance, useAutoAdvanceSetting} from "./useAutoAdvance";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("useAutoAdvance", () => {
    it("advances after the delay once everyone has submitted", () => {
        const onAdvance = vi.fn();
        renderHook(() => useAutoAdvance({enabled: true, ready: true, onAdvance, delayMs: 1500}));

        vi.advanceTimersByTime(1499);
        expect(onAdvance).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1);
        expect(onAdvance).toHaveBeenCalledOnce();
    });

    it("does nothing when disabled or not ready", () => {
        const onAdvance = vi.fn();
        renderHook(() => useAutoAdvance({enabled: false, ready: true, onAdvance}));
        renderHook(() => useAutoAdvance({enabled: true, ready: false, onAdvance}));

        vi.advanceTimersByTime(10000);
        expect(onAdvance).not.toHaveBeenCalled();
    });

    it("cancels a pending advance when the round stops being ready (e.g. reset)", () => {
        const onAdvance = vi.fn();
        const {rerender} = renderHook(
            ({ready}) => useAutoAdvance({enabled: true, ready, onAdvance}),
            {initialProps: {ready: true}},
        );

        vi.advanceTimersByTime(1000);
        rerender({ready: false});
        vi.advanceTimersByTime(5000);

        expect(onAdvance).not.toHaveBeenCalled();
    });

    it("does not restart the timer when only the callback changes", () => {
        const first = vi.fn();
        const second = vi.fn();
        const {rerender} = renderHook(
            ({onAdvance}) => useAutoAdvance({enabled: true, ready: true, onAdvance}),
            {initialProps: {onAdvance: first}},
        );

        vi.advanceTimersByTime(1000);
        rerender({onAdvance: second});
        vi.advanceTimersByTime(500);

        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledOnce();
    });
});

describe("useAutoAdvanceSetting", () => {
    afterEach(() => localStorage.clear());

    it("is on by default", () => {
        const {result} = renderHook(() => useAutoAdvanceSetting("game-1"));

        expect(result.current[0]).toBe(true);
    });

    it("remembers turning it off for that game only", () => {
        const first = renderHook(() => useAutoAdvanceSetting("game-1"));
        act(() => first.result.current[1](false));

        expect(renderHook(() => useAutoAdvanceSetting("game-1")).result.current[0]).toBe(false);
        expect(renderHook(() => useAutoAdvanceSetting("game-2")).result.current[0]).toBe(true);
    });
});
