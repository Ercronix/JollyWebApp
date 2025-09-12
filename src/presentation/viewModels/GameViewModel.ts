import React, { useState } from "react";

export type Player = {
    id: number;
    name: string;
    totalScore: number;
    currentRoundScore: number | null;
    hasSubmitted: boolean;
};

export type GameState = {
    players: Player[];
    currentDealer: number;
    roundNumber: number;
    showReorderMode: boolean;
    tempScores: { [playerId: number]: string };
    allPlayersSubmitted: boolean;
    submittedCount: number;
};

export type GameSearchParams = {
    lobbyId?: number;
    lobbyName?: string;
    playerCount?: number;
};

export class GameViewModel {
    private readonly setGameState: React.Dispatch<React.SetStateAction<GameState>>;
    private gameState: GameState;

    constructor(
        gameState: GameState,
        setGameState: React.Dispatch<React.SetStateAction<GameState>>
    ) {
        this.gameState = gameState;
        this.setGameState = setGameState;
    }

    // Initialize game with lobby data
    static initializeGame(searchParams: GameSearchParams): GameState {
        const playerCount = searchParams.playerCount || 4;
        const players = Array.from({ length: playerCount }, (_, index) => ({
            id: index + 1,
            name: `Player ${index + 1}`,
            totalScore: 0,
            currentRoundScore: null,
            hasSubmitted: false
        }));

        const allPlayersSubmitted = players.every(player => player.hasSubmitted);
        const submittedCount = players.filter(player => player.hasSubmitted).length;

        return {
            players,
            currentDealer: 0,
            roundNumber: 1,
            showReorderMode: false,
            tempScores: {},
            allPlayersSubmitted,
            submittedCount
        };
    }

// Handle score input changes
    handleScoreInput = (playerId: number, value: string) => {
        this.setGameState(prev => ({
            ...prev,
            tempScores: {
                ...prev.tempScores,
                [playerId]: value
            }
        }));
    };

    // Submit score for a player
    handleSubmitScore = (playerId: number) => {
        const scoreValue = parseInt(this.gameState.tempScores[playerId] || '0');
        if (isNaN(scoreValue)) return;

        this.setGameState(prev => {
            const newPlayers = prev.players.map(player =>
                player.id === playerId
                    ? {
                        ...player,
                        currentRoundScore: scoreValue,
                        hasSubmitted: true
                    }
                    : player
            );

            const newTempScores = { ...prev.tempScores };
            delete newTempScores[playerId];

            const allPlayersSubmitted = newPlayers.every(player => player.hasSubmitted);
            const submittedCount = newPlayers.filter(player => player.hasSubmitted).length;

            return {
                ...prev,
                players: newPlayers,
                tempScores: newTempScores,
                allPlayersSubmitted,
                submittedCount
            };
        });
    };

    // Advance to next round
    handleNextRound = () => {
        this.setGameState(prev => {
            const newPlayers = prev.players.map(player => ({
                ...player,
                totalScore: player.totalScore + (player.currentRoundScore || 0),
                currentRoundScore: null,
                hasSubmitted: false
            }));

            const newCurrentDealer = (prev.currentDealer + 1) % prev.players.length;

            return {
                ...prev,
                players: newPlayers,
                currentDealer: newCurrentDealer,
                roundNumber: prev.roundNumber + 1,
                tempScores: {},
                allPlayersSubmitted: false,
                submittedCount: 0
            };
        });
    };

    // Reset current round
    handleResetRound = () => {
        this.setGameState(prev => {
            const newPlayers = prev.players.map(player => ({
                ...player,
                currentRoundScore: null,
                hasSubmitted: false
            }));

            return {
                ...prev,
                players: newPlayers,
                tempScores: {},
                allPlayersSubmitted: false,
                submittedCount: 0
            };
        });
    };

    // Toggle reorder mode
    toggleReorderMode = () => {
        this.setGameState(prev => ({
            ...prev,
            showReorderMode: !prev.showReorderMode
        }));
    };

    // Reorder players with dealer position adjustment
    handleReorderPlayers = (fromIndex: number, toIndex: number) => {
        this.setGameState(prev => {
            const newPlayers = [...prev.players];
            const [movedPlayer] = newPlayers.splice(fromIndex, 1);
            newPlayers.splice(toIndex, 0, movedPlayer);

            // Adjust dealer index after reordering
            let newCurrentDealer = prev.currentDealer;
            if (fromIndex === prev.currentDealer) {
                newCurrentDealer = toIndex;
            } else if (fromIndex < prev.currentDealer && toIndex >= prev.currentDealer) {
                newCurrentDealer = prev.currentDealer - 1;
            } else if (fromIndex > prev.currentDealer && toIndex <= prev.currentDealer) {
                newCurrentDealer = prev.currentDealer + 1;
            }

            return {
                ...prev,
                players: newPlayers,
                currentDealer: newCurrentDealer
            };
        });
    };

    // Handle drag and drop
    handleDragStart = (e: React.DragEvent, playerIndex: number) => {
        e.dataTransfer.setData('text/plain', playerIndex.toString());
    };

    handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    handleDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));

        if (fromIndex !== targetIndex) {
            this.handleReorderPlayers(fromIndex, targetIndex);
        }
    };

    // Get game statistics
    getGameStats = () => {
        return {
            currentRound: this.gameState.roundNumber,
            submittedProgress: `${this.gameState.submittedCount}/${this.gameState.players.length}`,
            currentDealerName: this.gameState.players[this.gameState.currentDealer]?.name,
            highestTotalScore: Math.max(...this.gameState.players.map(p => p.totalScore))
        };
    };

    // Get current dealer info
    getCurrentDealer = () => {
        return this.gameState.players[this.gameState.currentDealer];
    };

    // Check if player can submit score
    canSubmitScore = (playerId: number) => {
        const tempScore = this.gameState.tempScores[playerId];
        return tempScore && tempScore.trim() !== '';
    };
}

// Custom hook for Game ViewModel
export function useGameViewModel(searchParams: GameSearchParams) {
    const [gameState, setGameState] = useState<GameState>(() =>
        GameViewModel.initializeGame(searchParams)
    );

    const viewModel = new GameViewModel(gameState, setGameState);

    return {
        gameState,
        viewModel
    };
}