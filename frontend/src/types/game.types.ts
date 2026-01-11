export interface Player {
    name: string;
    userId: string;
    totalScore: number;
    currentRoundScore: number;
    hasSubmitted: boolean;
    pointsHistory?: number[];
    createdAt: string;
}

export interface Game {
    winCondition: number;
    id: string;
    players: Player[];
    currentDealer: string;
    currentRound: number;
    createdAt: string;
    isFinished: boolean;
    winner: string | null;
}

export interface SubmitScoreResponse {
    game: Game;
    player: Player;
}

export interface NextRoundResponse {
    game: Game;
    message: string;
}

export interface SubmitWinConditionResponse {
    game: Game;
    message: string;
}

export type GameEventType =
    | 'CONNECTED'
    | 'ROUND_STARTED'
    | 'ROUND_RESET'
    | 'SCORE_SUBMITTED'
    | 'PLAYER_JOINED'
    | 'PLAYERS_REORDERED'
    | 'PLAYER_LEFT'
    | 'GAME_ENDED'
    | 'WIN_CONDITION_SET';

export interface GameEvent {
    type: GameEventType;
    game?: Game;
    gameId?: string;
    player?: {
        userId: string;
        name: string;
        score: number;
    };
    winner?: {
        userId: string;
        name: string;
        totalScore: number;
    };
    allPlayersSubmitted?: boolean;
}