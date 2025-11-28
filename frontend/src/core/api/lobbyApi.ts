import { api } from "./http";

export const lobbyApi = {
    getLobbies() {
        return api.get("/api/lobbies");
    },

    createLobby(name: string, userId: string) {
        return api.post("/api/lobbies", { name, userId });
    }
};
