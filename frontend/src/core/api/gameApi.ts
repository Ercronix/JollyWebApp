import { api } from "./http";

export const gameApi = {
    getGame(gameId: number) {
        return api.get(`/api/games/${gameId}`);
    },

    submitScore(gameId: number, playerId: number, score: number) {
        return api.post(`/api/games/${gameId}/submitScore`, {
            playerId,
            score
        });
    },

    nextRound(gameId: number) {
        return api.post(`/api/games/${gameId}/nextRound`);
    },

    reorderPlayers(gameId: number, fromIndex: number, toIndex: number) {
        return api.post(`/api/games/${gameId}/reorderPlayers`, {
            fromIndex,
            toIndex
        });
    }
};
