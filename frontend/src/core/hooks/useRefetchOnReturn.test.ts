import {afterEach, describe, expect, it, vi} from "vitest";
import {renderHook} from "@testing-library/react";
import {useRefetchOnReturn} from "./useRefetchOnReturn";

let visibility: DocumentVisibilityState = "visible";
Object.defineProperty(document, "visibilityState", {configurable: true, get: () => visibility});

afterEach(() => {
    visibility = "visible";
});

describe("useRefetchOnReturn", () => {
    it("refetches when the window regains focus", () => {
        const refetch = vi.fn();
        renderHook(() => useRefetchOnReturn(refetch));

        window.dispatchEvent(new Event("focus"));

        expect(refetch).toHaveBeenCalledOnce();
    });

    it("refetches when the tab becomes visible, not when it is hidden", () => {
        const refetch = vi.fn();
        renderHook(() => useRefetchOnReturn(refetch));

        visibility = "hidden";
        document.dispatchEvent(new Event("visibilitychange"));
        expect(refetch).not.toHaveBeenCalled();

        visibility = "visible";
        document.dispatchEvent(new Event("visibilitychange"));
        expect(refetch).toHaveBeenCalledOnce();
    });

    it("stops listening after unmount", () => {
        const refetch = vi.fn();
        const {unmount} = renderHook(() => useRefetchOnReturn(refetch));

        unmount();
        window.dispatchEvent(new Event("focus"));

        expect(refetch).not.toHaveBeenCalled();
    });
});
