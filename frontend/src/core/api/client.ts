// src/core/api/client.ts

// Type definitions based on backend API
export interface User {
    id: string;
    username: string;
    createdAt: string;
}

export interface Player {
    name: string;
    userId: string;
    totalScore: number;
    currentRoundScore: number;
    hasSubmitted: boolean;
    createdAt: string;
}

export interface Game {
    id: string;
    players: Player[];
    currentDealer: string;
    currentRound: number;
    createdAt: string;
    isFinished: boolean;
    winner: string | null;
}

export interface Lobby {
    id: string;
    name: string;
    playerCount: number;
    createdAt: string;
    gameId?: string;
}

export interface LoginResponse {
    user: User;
    sessionId: string;
}

export interface JoinLobbyResponse {
    lobby: Lobby;
    playerId: string;
}

export interface SubmitScoreResponse {
    game: Game;
    player: Player;
}

export interface NextRoundResponse {
    game: Game;
    message: string;
}

export interface GameEvent {
    type: 'CONNECTED' | 'ROUND_STARTED' | 'ROUND_RESET' | 'SCORE_SUBMITTED' | 'PLAYER_JOINED' | 'GAME_ENDED';
    game?: Game;
    gameId?: string;
    winner?: {
        userId: string;
        name: string;
        totalScore: number;
    };
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export class ApiClient {
    private static sessionId: string | null = null;

    static setSessionId(sessionId: string) {
        this.sessionId = sessionId;
    }

    static getSessionId(): string | null {
        return this.sessionId;
    }

    private static getHeaders(): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (this.sessionId) {
            headers['x-session-id'] = this.sessionId;
        }

        return headers;
    }

    static async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                ...this.getHeaders(),
                ...options.headers,
            },
            credentials: 'include',
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(error.message || `HTTP ${response.status}`);
        }

        if (response.status === 204) {
            return {} as T;
        }

        return response.json();
    }

    // User endpoints
    static async login(username: string): Promise<LoginResponse> {
        const response = await this.request<LoginResponse>(
            '/users/login',
            {
                method: 'POST',
                body: JSON.stringify({ username }),
            }
        );
        this.setSessionId(response.sessionId);
        return response;
    }

    static async logout(): Promise<void> {
        await this.request<void>('/users/logout', { method: 'POST' });
        this.setSessionId('');
    }

    static async getCurrentUser(): Promise<User> {
        return this.request<User>('/users/me', { method: 'GET' });
    }

    // Lobby endpoints
    static async listLobbies(): Promise<Lobby[]> {
        return this.request<Lobby[]>('/api/lobbies', { method: 'GET' });
    }

    static async createLobby(name: string, userId: string): Promise<Lobby> {
        return this.request<Lobby>('/api/lobbies', {
            method: 'POST',
            body: JSON.stringify({ name, userId }),
        });
    }

    static async joinLobby(lobbyId: string, userId: string): Promise<JoinLobbyResponse> {
        return this.request<JoinLobbyResponse>(
            `/api/lobbies/${lobbyId}/join`,
            {
                method: 'POST',
                body: JSON.stringify({ userId }),
            }
        );
    }

    // Game endpoints
    static async getGameState(gameId: string): Promise<Game> {
        return this.request<Game>(`/api/games/${gameId}`, { method: 'GET' });
    }

    static async submitScore(gameId: string, playerId: string, score: number): Promise<SubmitScoreResponse> {
        return this.request<SubmitScoreResponse>(
            `/api/games/${gameId}/submitScore`,
            {
                method: 'POST',
                body: JSON.stringify({ playerId, score }),
            }
        );
    }

    static async nextRound(gameId: string): Promise<NextRoundResponse> {
        return this.request<NextRoundResponse>(
            `/api/games/${gameId}/nextRound`,
            {
                method: 'POST',
            }
        );
    }

    static async resetRound(gameId: string, userId: string): Promise<NextRoundResponse> {
        return this.request<NextRoundResponse>(
            `/api/games/${gameId}/resetRound`,
            {
                method: 'POST',
                body: JSON.stringify({ userId }),
            }
        );
    }

    static async reorderPlayers(
        gameId: string,
        fromIndex: number,
        toIndex: number,
        userId: string
    ): Promise<Game> {
        return this.request<Game>(`/api/games/${gameId}/reorderPlayers`, {
            method: 'POST',
            body: JSON.stringify({ fromIndex, toIndex, userId }),
        });
    }

    static async forceNextRound(gameId: string): Promise<NextRoundResponse> {
        return this.request<NextRoundResponse>(
            `/admin/games/${gameId}/forceNextRound`,
            {
                method: 'POST',
            }
        );
    }

    // SSE endpoint
    static subscribeToGameEvents(gameId: string, onEvent: (data: GameEvent) => void): () => void {
        const eventSource = new EventSource(
            `${API_BASE_URL}/api/games/${gameId}/events`,
            { withCredentials: true }
        );

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data) as GameEvent;
                onEvent(data);
            } catch (error) {
                console.error('Failed to parse SSE event:', error);
            }
        };

        eventSource.onerror = (error) => {
            console.error('SSE connection error:', error);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }
}