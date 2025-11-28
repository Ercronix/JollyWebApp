import { useState, useMemo } from "react";
import { useGame } from "@/presentation/hooks/useGame";
import { userService } from "@/core/services/userService";

// Type definitions
type Player = {
    id: number;
    name: string;
    userId: string;
    totalScore: number;
    currentRoundScore: number;
    hasSubmitted: boolean;
};

type Game = {
    id: number;
    players: Player[];
    currentDealer: number;
    currentRound: number;
};

type TransformedPlayer = {
    id: number;
    name: string;
    totalScore: number;
    currentRoundScore: number;
    hasSubmitted: boolean;
    isCurrentUser: boolean;
};

export function useGamePage(gameId: number) {
    const currentUser = userService.getUser();
    const { game, isLoading, submitScore, nextRound, reorderPlayers } = useGame(gameId);

    const [showReorderMode, setShowReorderMode] = useState(false);
    const [tempScores, setTempScores] = useState<Record<number, string>>({});
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    // Transform game data into UI-friendly format
    const gameState = useMemo(() => {
        if (!game) {
            return {
                players: [] as TransformedPlayer[],
                currentDealer: 0,
                showReorderMode,
                allPlayersSubmitted: false,
                tempScores,
            };
        }

        const typedGame = game as Game;
        const players: TransformedPlayer[] = typedGame.players.map((player: Player) => ({
            id: player.id,
            name: player.name,
            totalScore: player.totalScore || 0,
            currentRoundScore: player.currentRoundScore || 0,
            hasSubmitted: player.hasSubmitted || false,
            isCurrentUser: currentUser?.id === player.userId,
        }));

        const allPlayersSubmitted = players.every((p: TransformedPlayer) => p.hasSubmitted);

        return {
            players,
            currentDealer: typedGame.currentDealer || 0,
            showReorderMode,
            allPlayersSubmitted,
            tempScores,
        };
    }, [game, showReorderMode, tempScores, currentUser]);

    // Calculate game statistics
    const gameStats = useMemo(() => {
        const submittedCount = gameState.players.filter((p) => p.hasSubmitted).length;
        const totalPlayers = gameState.players.length;
        const currentDealerName = gameState.players[gameState.currentDealer]?.name || "N/A";
        const highestTotalScore = Math.max(...gameState.players.map((p) => p.totalScore), 0);

        return {
            currentRound: (game as Game | undefined)?.currentRound || 1,
            submittedProgress: `${submittedCount}/${totalPlayers}`,
            currentDealerName,
            highestTotalScore,
        };
    }, [gameState, game]);

    // Check if current user has submitted
    const hasCurrentUserSubmitted = useMemo(() => {
        return gameState.players.some((p) => p.isCurrentUser && p.hasSubmitted);
    }, [gameState.players]);

    // Event handlers
    const handleScoreInput = (playerId: number, value: string) => {
        setTempScores(prev => ({
            ...prev,
            [playerId]: value,
        }));
    };

    const canSubmitScore = (playerId: number): boolean => {
        const score = tempScores[playerId];
        return score !== undefined && score !== '' && !isNaN(Number(score));
    };

    const handleSubmitScore = (playerId: number) => {
        const score = tempScores[playerId];
        if (canSubmitScore(playerId)) {
            submitScore({ playerId, score: Number(score) });
            // Clear the temp score after submission
            setTempScores(prev => {
                const newScores = { ...prev };
                delete newScores[playerId];
                return newScores;
            });
        }
    };

    const handleNextRound = () => {
        nextRound();
        // Clear all temp scores when starting new round
        setTempScores({});
    };

    const handleResetRound = () => {
        // Reset is typically handled by the backend
        // You might need to add a resetRound API endpoint
        setTempScores({});
        // If you have a reset endpoint: resetRound();
    };

    const toggleReorderMode = () => {
        setShowReorderMode(prev => !prev);
    };

    // Drag and drop handlers
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent, toIndex: number) => {
        e.preventDefault();

        if (draggedIndex === null || draggedIndex === toIndex) {
            setDraggedIndex(null);
            return;
        }

        reorderPlayers({ fromIndex: draggedIndex, toIndex });
        setDraggedIndex(null);
    };

    return {
        currentUser,
        gameState,
        gameStats,
        hasCurrentUserSubmitted,
        isLoading,
        // Methods
        handleScoreInput,
        canSubmitScore,
        handleSubmitScore,
        handleNextRound,
        handleResetRound,
        toggleReorderMode,
        handleDragStart,
        handleDragOver,
        handleDrop,
    };
}