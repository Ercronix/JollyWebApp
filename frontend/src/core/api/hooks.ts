// src/core/api/hooks.ts - Add useLeaveLobby hook

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {ApiClient} from './client';
import {useEffect} from 'react';
import type { GameEvent } from '@/types';

// Query keys
export const queryKeys = {
    currentUser: ['currentUser'],
    lobbies: ['lobbies'],
    game: (gameId: string) => ['game', gameId],
};

// User hooks
export function useCurrentUser() {
    return useQuery({
        queryKey: queryKeys.currentUser,
        queryFn: () => ApiClient.getCurrentUser(),
        retry: false,
    });
}

export function useLogin() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (username: string) => ApiClient.login(username),
        onSuccess: (data) => {
            queryClient.setQueryData(queryKeys.currentUser, data.user);
        },
    });
}

export function useLogout() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => ApiClient.logout(),
        onSuccess: () => {
            queryClient.setQueryData(queryKeys.currentUser, null);
            queryClient.clear();
        },
    });
}

// Lobby hooks
export function useLobbies() {
    return useQuery({
        queryKey: queryKeys.lobbies,
        queryFn: () => ApiClient.listLobbies(),
        refetchInterval: 5000, // Auto-refresh every 5 seconds
    });
}

export function useCreateLobby() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ name, userId }: { name: string; userId: string }) =>
            ApiClient.createLobby(name, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.lobbies });
        },
    });
}

export function useJoinLobby() {
    return useMutation({
        mutationFn: ({ lobbyId, userId }: { lobbyId: string; userId: string }) =>
            ApiClient.joinLobby(lobbyId, userId),
    });
}

export function useLeaveLobby() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ lobbyId, userId }: { lobbyId: string; userId: string }) =>
            ApiClient.leaveLobby(lobbyId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.lobbies });
        },
    });
}

export function useDeleteLobby() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ lobbyId, userId }: { lobbyId: string; userId: string }) =>
            ApiClient.deleteLobby(lobbyId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.lobbies });
        },
    });
}

export function useArchiveLobby(){
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ lobbyId }: { lobbyId: string }) =>
            ApiClient.archiveLobby(lobbyId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.lobbies });
        }
    })
}

// Game hooks
export function useGameState(gameId: string | undefined) {
    return useQuery({
        queryKey: gameId ? queryKeys.game(gameId) : ['game', 'undefined'],
        queryFn: () => gameId ? ApiClient.getGameState(gameId) : Promise.reject('No game ID'),
        enabled: !!gameId,
        refetchOnWindowFocus: false,
    });
}

export function useSubmitScore() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
                         gameId,
                         playerId,
                         score,
                     }: {
            gameId: string;
            playerId: string;
            score: number;
        }) => ApiClient.submitScore(gameId, playerId, score),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.game(variables.gameId) });
        },
    });
}

export function useNextRound() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (gameId: string) => ApiClient.nextRound(gameId),
        onSuccess: (_, gameId) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.game(gameId) });
        },
    });
}

export function useResetRound() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ gameId, userId }: { gameId: string; userId: string }) =>
            ApiClient.resetRound(gameId, userId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.game(variables.gameId) });
        },
    });
}

export function useReorderPlayers() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
                         gameId,
                         fromIndex,
                         toIndex,
                         userId,
                     }: {
            gameId: string;
            fromIndex: number;
            toIndex: number;
            userId: string;
        }) => ApiClient.reorderPlayers(gameId, fromIndex, toIndex, userId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.game(variables.gameId) });
        },
    });
}

export function useForceNextRound() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (gameId: string) => ApiClient.forceNextRound(gameId),
        onSuccess: (_, gameId) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.game(gameId) });
        },
    });
}

// SSE hook for game events
export function useGameEvents(gameId: string | undefined) {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!gameId) return;

        console.log('Subscribing to game events for gameId:', gameId);

        const unsubscribe = ApiClient.subscribeToGameEvents(gameId, (eventData: GameEvent) => {
            console.log('Game event received:', eventData);

            switch (eventData.type) {
                case 'CONNECTED':
                    console.log('Connected to game events');
                    break;

                case 'ROUND_STARTED':
                case 'ROUND_RESET':
                case 'SCORE_SUBMITTED':
                case 'PLAYER_JOINED':
                case 'PLAYERS_REORDERED':
                case  'PLAYER_LEFT':
                    // Update game state in cache
                    if (eventData.game) {
                        console.log('Updating game state from SSE event:', eventData.type);
                        console.log('New game state:', eventData.game);
                        queryClient.setQueryData(queryKeys.game(gameId), eventData.game);
                        // Force refetch to ensure UI updates
                        queryClient.invalidateQueries({ queryKey: queryKeys.game(gameId) });
                    }
                    break;

                case 'GAME_ENDED':
                    if (eventData.game) {
                        queryClient.setQueryData(queryKeys.game(gameId), eventData.game);
                        queryClient.invalidateQueries({ queryKey: queryKeys.game(gameId) });
                    }
                    // Show winner notification
                    if (eventData.winner) {
                        console.log(`Game ended! Winner: ${eventData.winner.name}`);
                    }
                    break;

                default:
                    console.log('Unknown event type:', eventData.type);
            }
        });

        return () => {
            console.log('Unsubscribing from game events');
            unsubscribe();
        };
    }, [gameId, queryClient]);
}