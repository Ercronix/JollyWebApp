import {describe, expect, it, vi} from "vitest";
import {act, renderHook} from "@testing-library/react";
import {useLogoutFlow} from "./useLogoutFlow";

describe("useLogoutFlow", () => {
    it("asks for confirmation when the account has no password", async () => {
        const logout = vi.fn().mockResolvedValue(undefined);
        const {result} = renderHook(() => useLogoutFlow({hasPassword: false}, logout));

        act(() => result.current.requestLogout());

        expect(result.current.showWarning).toBe(true);
        expect(logout).not.toHaveBeenCalled();

        await act(() => result.current.confirmLogout());

        expect(logout).toHaveBeenCalledOnce();
        expect(result.current.showWarning).toBe(false);
    });

    it("closes the warning without logging out on cancel", () => {
        const logout = vi.fn().mockResolvedValue(undefined);
        const {result} = renderHook(() => useLogoutFlow({hasPassword: false}, logout));

        act(() => result.current.requestLogout());
        act(() => result.current.cancel());

        expect(result.current.showWarning).toBe(false);
        expect(logout).not.toHaveBeenCalled();
    });

    it("logs out directly when the account has a password", () => {
        const logout = vi.fn().mockResolvedValue(undefined);
        const {result} = renderHook(() => useLogoutFlow({hasPassword: true}, logout));

        act(() => result.current.requestLogout());

        expect(result.current.showWarning).toBe(false);
        expect(logout).toHaveBeenCalledOnce();
    });
});
