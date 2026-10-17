import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {act, renderHook} from "@testing-library/react";
import {useElapsedTime} from "./useElapsedTime";

beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));
});

afterEach(() => vi.useRealTimers());

// Issue #48: how long the game is running
describe("useElapsedTime", () => {
    it("counts up every second while the game is running", () => {
        const {result} = renderHook(() => useElapsedTime("2026-01-01T11:00:00Z"));
        expect(result.current).toBe(3_600_000);

        act(() => vi.advanceTimersByTime(2_000));

        expect(result.current).toBe(3_602_000);
    });

    it("stops at the end of a finished game", () => {
        const {result} = renderHook(() => useElapsedTime("2026-01-01T11:00:00Z", "2026-01-01T11:30:00Z"));

        act(() => vi.advanceTimersByTime(5_000));

        expect(result.current).toBe(1_800_000);
        expect(vi.getTimerCount()).toBe(0);
    });

    it("is null without a start time", () => {
        const {result} = renderHook(() => useElapsedTime(undefined));

        expect(result.current).toBeNull();
    });
});
