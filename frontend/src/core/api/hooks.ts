// src/core/api/hooks.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {ApiClient} from './client';
import {useEffect, useRef} from 'react';
import type { Game, GameEvent } from '@/types';
import { mergeEventGame } from './gameEvents';
import { logger } from '@/utils/logger';
import { UserModel } from '@/core/models/UserModel';

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
        mutationFn: ({ username, password }: { username: string; password?: string }) =>
            ApiClient.login(username, password),
        onSuccess: (data) => {
            queryClient.setQueryData(queryKeys.currentUser, data.user);
        },
    });
}

export function useRegister() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ username, password }: { username: string; password: string }) =>
            ApiClient.register(username, password),
        onSuccess: (data) => {
            queryClient.setQueryData(queryKeys.currentUser, data.user);
        },
    });
}

export function useSecureAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (password: string) => ApiClient.secureAccount(password),
        onSuccess: (user) => {
            UserModel.getInstance().setUser(user);
            queryClient.setQueryData(queryKeys.currentUser, user);
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
        refetchInterval: 5000,
    });
}

export function useLobbyHistory() {
    return useQuery({
        queryKey: ['lobbies', 'history'],
        queryFn: () => ApiClient.listAllLobbies(),
        refetchOnWindowFocus: false,
    });
}

export function useCreateLobby() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ name, isPrivate }: { name: string; isPrivate?: boolean }) =>
            ApiClient.createLobby(name, isPrivate || false),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.lobbies });
        },
    });
}

export function useJoinLobbyByCode() {
    return useMutation({
        mutationFn: ({ accessCode }: { accessCode: string }) =>
            ApiClient.joinLobbyByCode(accessCode),
    });
}

export function useGetLobbyByCode(accessCode: string | undefined) {
    return useQuery({
        queryKey: ['lobby', 'code', accessCode],
        queryFn: () => accessCode ? ApiClient.getLobbyByCode(accessCode) : Promise.reject('No code'),
        enabled: !!accessCode,
        retry: false,
    });
}

export function useJoinLobby() {
    return useMutation({
        mutationFn: ({ lobbyId }: { lobbyId: string }) =>
            ApiClient.joinLobby(lobbyId),
    });
}

export function useLeaveLobby() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ lobbyId }: { lobbyId: string }) =>
            ApiClient.leaveLobby(lobbyId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.lobbies });
        },
    });
}

export function useDeleteLobby() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ lobbyId }: { lobbyId: string }) =>
            ApiClient.deleteLobby(lobbyId),
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
        mutationFn: ({ gameId, score }: { gameId: string; score: number }) =>
            ApiClient.submitScore(gameId, score),
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
        mutationFn: ({ gameId }: { gameId: string }) =>
            ApiClient.resetRound(gameId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.game(variables.gameId) });
        },
    });
}

export function useReorderPlayers() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ gameId, fromIndex, toIndex }: { gameId: string; fromIndex: number; toIndex: number }) =>
            ApiClient.reorderPlayers(gameId, fromIndex, toIndex),
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

export function useSubmitWinCondition() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ gameId, winCondition }: { gameId: string; winCondition: number }) =>
            ApiClient.submitWinCondition(gameId, winCondition),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({queryKey: queryKeys.game(variables.gameId)});
        },
    });
}

export function useUpdateHistoryScore() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ gameId, roundIndex, newScore }: { gameId: string; roundIndex: number; newScore: number }) =>
            ApiClient.updateHistoryScore(gameId, roundIndex, newScore),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.game(variables.gameId) });
        },
    });
}

export function useAddPlayerToGame() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ gameId, playerName }: { gameId: string; playerName: string }) =>
            ApiClient.addPlayerToGame(gameId, playerName),
        onSuccess: (data, variables) => {
            queryClient.setQueryData(queryKeys.game(variables.gameId), data);
            queryClient.invalidateQueries({ queryKey: queryKeys.game(variables.gameId) });
        },
    });
}

export function useRemovePlayerFromGame() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ gameId, playerId }: { gameId: string; playerId: string }) =>
            ApiClient.removePlayerFromGame(gameId, playerId),
        onSuccess: (data, variables) => {
            queryClient.setQueryData(queryKeys.game(variables.gameId), data);
            queryClient.invalidateQueries({ queryKey: queryKeys.game(variables.gameId) });
        },
    });
}

export function useSubmitScoreForPlayer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
                         gameId,
                         playerId,
                         score
                     }: {
            gameId: string;
            playerId: string;
            score: number;
        }) => ApiClient.submitScoreForPlayer(gameId, playerId, score),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.game(variables.gameId) });
        },
    });
}

// SSE hook for game events
export function useGameEvents(gameId: string | undefined, onOwnerChanged?: (event: GameEvent) => void) {
    const queryClient = useQueryClient();
    // A ref, so a new callback each render doesn't reopen the EventSource
    const onOwnerChangedRef = useRef(onOwnerChanged);
    useEffect(() => {
        onOwnerChangedRef.current = onOwnerChanged;
    }, [onOwnerChanged]);

    useEffect(() => {
        if (!gameId) return;

        logger.debug('Subscribing to game events for gameId:', gameId);

        const setGame = (id: string, game: Game) =>
            queryClient.setQueryData<Game>(queryKeys.game(id), cached => mergeEventGame(cached, game));

        const unsubscribe = ApiClient.subscribeToGameEvents(gameId, (eventData: GameEvent) => {
            logger.debug('Game event received:', eventData);

            switch (eventData.type) {
                case 'CONNECTED':
                    logger.debug('Connected to game events');
                    break;

                case 'ROUND_STARTED':
                case 'ROUND_RESET':
                case 'SCORE_SUBMITTED':
                case 'PLAYER_JOINED':
                case 'PLAYERS_REORDERED':
                case  'PLAYER_LEFT':
                case 'WIN_CONDITION_SET':
                case 'HISTORY_SCORE_UPDATED':
                case 'PLAYER_REMOVED':
                    if (eventData.game) {
                        logger.debug('Updating game state from SSE event:', eventData.type);
                        logger.debug('New game state:', eventData.game);
                        setGame(gameId, eventData.game);
                        queryClient.invalidateQueries({ queryKey: queryKeys.game(gameId) });
                    }
                    break;

                case 'GAME_ENDED':
                    if (eventData.game) {
                        setGame(gameId, eventData.game);
                        queryClient.invalidateQueries({ queryKey: queryKeys.game(gameId) });
                    }
                    if (eventData.winner) {
                        logger.debug(`Game ended! Winner: ${eventData.winner.name}`);
                    }
                    break;

                case 'OWNER_CHANGED':
                    queryClient.invalidateQueries({ queryKey: queryKeys.game(gameId) });
                    onOwnerChangedRef.current?.(eventData);
                    break;

                default:
                    logger.debug('Unknown event type:', eventData.type);
            }
        });

        return () => {
            logger.debug('Unsubscribing from game events');
            unsubscribe();
        };
    }, [gameId, queryClient]);
}