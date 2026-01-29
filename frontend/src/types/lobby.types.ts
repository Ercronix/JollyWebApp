export interface Lobby {
    id: string;
    name: string;
    playerCount: number;
    createdAt: string;
    gameId?: string;
    archived?: boolean;
    isPrivate?: boolean;
    accessCode?: string;
}

export interface JoinLobbyResponse {
    lobby: Lobby;
    playerId: string;
}