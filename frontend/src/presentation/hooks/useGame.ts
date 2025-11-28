import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gameApi } from "@/core/api/gameApi";

export function useGame(gameId: number) {
    const qc = useQueryClient();

    const gameQuery = useQuery({
        queryKey: ["game", gameId],
        queryFn: () => gameApi.getGame(gameId),
    });

    const submitScore = useMutation({
        mutationFn: (payload: { playerId: number; score: number }) =>
            gameApi.submitScore(gameId, payload.playerId, payload.score),
        onSuccess: () =>
            qc.invalidateQueries({
                queryKey: ["game", gameId],
            }),
    });

    const nextRound = useMutation({
        mutationFn: () => gameApi.nextRound(gameId),
        onSuccess: () =>
            qc.invalidateQueries({
                queryKey: ["game", gameId],
            }),
    });

    const reorderPlayers = useMutation({
        mutationFn: (payload: { fromIndex: number; toIndex: number }) =>
            gameApi.reorderPlayers(gameId, payload.fromIndex, payload.toIndex),
        onSuccess: () =>
            qc.invalidateQueries({
                queryKey: ["game", gameId],
            }),
    });

    return {
        game: gameQuery.data,
        isLoading: gameQuery.isLoading,
        submitScore: submitScore.mutate,
        nextRound: nextRound.mutate,
        reorderPlayers: reorderPlayers.mutate,
    };
}
