import {afterEach, describe, expect, it} from "vitest";
import {act, renderHook} from "@testing-library/react";
import {useStoredFlag} from "./useStoredFlag";

afterEach(() => localStorage.clear());

// Regression: issue #12 "Auto Advance Rounds reseting" - the setting was lost on reload
describe("useStoredFlag", () => {
    it("starts with the default value", () => {
        const {result} = renderHook(() => useStoredFlag("flag"));

        expect(result.current[0]).toBe(false);
    });

    it("keeps the value across remounts (page reload, round change)", () => {
        const first = renderHook(() => useStoredFlag("flag"));
        act(() => first.result.current[1](true));
        first.unmount();

        const second = renderHook(() => useStoredFlag("flag"));

        expect(second.result.current[0]).toBe(true);
    });

    it("stores values per key", () => {
        const gameA = renderHook(() => useStoredFlag("autoAdvance:a"));
        act(() => gameA.result.current[1](true));

        const gameB = renderHook(() => useStoredFlag("autoAdvance:b"));

        expect(gameB.result.current[0]).toBe(false);
    });

    it("can be turned off again", () => {
        const {result} = renderHook(() => useStoredFlag("flag", true));
        act(() => result.current[1](false));

        expect(renderHook(() => useStoredFlag("flag", true)).result.current[0]).toBe(false);
    });
});
