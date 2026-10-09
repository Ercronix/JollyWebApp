import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {ApiClient} from "./client";
import {UserModel} from "@/core/models/UserModel";

const user = {id: "1", username: "Tim", fullTag: "Tim#4523", createdAt: "2026-01-01"};

function mockFetch(status: number, body: unknown = {}) {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), {status}));
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
}

let assign: ReturnType<typeof vi.fn>;

beforeEach(() => {
    assign = vi.fn();
    vi.stubGlobal("location", {...window.location, pathname: "/lobby", assign});
    UserModel.getInstance().setUser(user);
});

afterEach(() => {
    vi.unstubAllGlobals();
    UserModel.getInstance().clearUser();
    localStorage.clear();
    ApiClient.setSessionId("");
});

describe("ApiClient.request", () => {
    it("sends cookies and the session header", async () => {
        const fetchMock = mockFetch(200, user);
        ApiClient.setSessionId("abc");

        await ApiClient.getCurrentUser();

        const [, init] = fetchMock.mock.calls[0];
        expect(init.credentials).toBe("include");
        expect(init.headers["x-session-id"]).toBe("abc");
    });

    it("throws the server's error message", async () => {
        mockFetch(400, {message: "Score must be divisible by 5"});

        await expect(ApiClient.submitScore("g", "p", 7)).rejects.toThrow("Score must be divisible by 5");
    });

    it("expires the local session and redirects to login on 401", async () => {
        mockFetch(401, {message: "Not authenticated"});

        await expect(ApiClient.listLobbies()).rejects.toThrow("Not authenticated");

        expect(UserModel.getInstance().getCurrentUser()).toBeNull();
        expect(UserModel.getInstance().getLastFullTag()).toBe("Tim#4523");
        expect(assign).toHaveBeenCalledWith("/");
    });

    it("does not log out on 401 from the login endpoints (wrong password)", async () => {
        mockFetch(401, {message: "Invalid username or password"});

        await expect(ApiClient.login("Tim", "wrong")).rejects.toThrow("Invalid username or password");

        expect(UserModel.getInstance().getCurrentUser()).toEqual(user);
        expect(assign).not.toHaveBeenCalled();
    });

    it("returns an empty object for 204 responses", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, {status: 204})));

        await expect(ApiClient.leaveLobby("l", "u")).resolves.toEqual({});
    });
});
