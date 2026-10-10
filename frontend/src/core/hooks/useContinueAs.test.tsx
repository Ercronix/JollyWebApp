import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {act, renderHook} from "@testing-library/react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import type {ReactNode} from "react";
import {useContinueAs} from "./useContinueAs";
import {UserModel} from "@/core/models/UserModel";

const user = {id: "1", username: "Tim", fullTag: "Tim#4523", hasPassword: false, createdAt: "2026-01-01"};

function mockFetch(status: number, body: unknown) {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(body), {status})));
}

function renderContinueAs() {
    const queryClient = new QueryClient({defaultOptions: {mutations: {retry: false}}});
    const wrapper = ({children}: {children: ReactNode}) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return renderHook(() => useContinueAs(), {wrapper});
}

beforeEach(() => {
    localStorage.setItem("app_last_tag", "Tim#4523");
});

afterEach(() => {
    vi.unstubAllGlobals();
    UserModel.getInstance().clearUser();
    localStorage.clear();
});

describe("useContinueAs", () => {
    it("exposes the remembered tag", () => {
        expect(renderContinueAs().result.current.lastTag).toBe("Tim#4523");
    });

    it("logs into the remembered account", async () => {
        mockFetch(200, {user, sessionId: "s"});
        const {result} = renderContinueAs();

        let outcome;
        await act(async () => {
            outcome = await result.current.continueAs();
        });

        expect(outcome).toBe("ok");
        expect(UserModel.getInstance().getCurrentUser()).toEqual(user);
    });

    it("asks for the password when the account is protected", async () => {
        mockFetch(403, {message: "This account is password-protected."});
        const {result} = renderContinueAs();

        let outcome;
        await act(async () => {
            outcome = await result.current.continueAs();
        });

        expect(outcome).toBe("needs-password");
        expect(result.current.lastTag).toBe("Tim#4523");
    });

    it("forgets the tag when the account no longer exists", async () => {
        mockFetch(404, {message: "Account not found with this tag"});
        const {result} = renderContinueAs();

        let outcome;
        await act(async () => {
            outcome = await result.current.continueAs();
        });

        expect(outcome).toBe("not-found");
        expect(result.current.lastTag).toBeNull();
        expect(UserModel.getInstance().getLastFullTag()).toBeNull();
    });
});
