// src/presentation/pages/GamePage.tsx
import React, { useState, useEffect } from "react";
import { Button } from "@/presentation/components/Button";
import { Input } from "@/presentation/components/input";
import { Text } from "@/presentation/components/Text";
import { ScoreCalculator } from "@/presentation/components/ScoreCalculator";
import { PlayerHistoryModal } from "@/presentation/components/PlayerHistoryModal";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { MainLayout } from "@/presentation/layout/MainLayout";
import { UserModel } from "@/core/models/UserModel";
import type { Player } from "@/types";
import {
    useGameState,
    useGameEvents,
    useSubmitScore,
    useNextRound,
    useResetRound,
    useReorderPlayers,
    useLeaveLobby,
} from "@/core/api/hooks";

export type GameSearchParams = {
    gameId?: string;
    lobbyName?: string;
    lobbyId?: string;
};

export function GamePage() {
    const navigate = useNavigate();
    const searchParams = useSearch({ from: '/Game' }) as GameSearchParams;
    const currentUser = UserModel.getInstance().getCurrentUser();

    const [showReorderMode, setShowReorderMode] = useState(false);
    const [tempScores, setTempScores] = useState<Record<string, string>>({});
    const [scoreErrors, setScoreErrors] = useState<Record<string, string>>({});
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [calculatorOpen, setCalculatorOpen] = useState<string | null>(null);
    const [historyPlayer, setHistoryPlayer] = useState<Player | null>(null);

    // React Query hooks
    const { data: game, isLoading } = useGameState(searchParams.gameId);
    const submitScoreMutation = useSubmitScore();
    const nextRoundMutation = useNextRound();
    const resetRoundMutation = useResetRound();
    const reorderPlayersMutation = useReorderPlayers();
    const leaveLobbyMutation = useLeaveLobby();

    // Subscribe to SSE events
    useGameEvents(searchParams.gameId);

    // Check if user is logged in
    useEffect(() => {
        if (!currentUser) {
            navigate({ to: "/" });
        }
    }, [currentUser, navigate]);

    if (!currentUser) {
        return null;
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Text size="lg" className="text-gray-400">
                    Loading game...
                </Text>
            </div>
        );
    }

    if (!game || !searchParams.gameId) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Text size="lg" className="text-red-400">
                    Game not found
                </Text>
            </div>
        );
    }

    const handleBackToLobby = () => {
        navigate({ to: "/lobby" });
    };

    const handleLeaveLobby = async () => {
        if (!searchParams.lobbyId || !currentUser) return;

        try {
            await leaveLobbyMutation.mutateAsync({
                lobbyId: searchParams.lobbyId,
                userId: currentUser.id,
            });
            navigate({ to: "/lobby" });
        } catch (error) {
            console.error('Failed to leave lobby:', error);
        }
    };

    const handleScoreInput = (playerId: string, value: string) => {
        const currentUserPlayer = game.players.find((p: Player) => p.userId === currentUser.id);
        if (currentUserPlayer?.userId !== playerId) {
            return;
        }

        // Allow empty string
        if (value === '') {
            setTempScores(prev => ({ ...prev, [playerId]: value }));
            setScoreErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[playerId];
                return newErrors;
            });
            return;
        }
        if (!/^(-?\d*)$/.test(value)) {
            return;
        }

        const numericValue = parseInt(value, 10);

        // Check if divisible by 5
        if (numericValue % 5 !== 0) {
            setScoreErrors(prev => ({
                ...prev,
                [playerId]: 'Score must be divisible by 5'
            }));
        } else {
            setScoreErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[playerId];
                return newErrors;
            });
        }

        setTempScores(prev => ({ ...prev, [playerId]: value }));
    };

    const handleSubmitScore = async (playerId: string) => {
        const scoreValue = parseInt(tempScores[playerId] || '0');

        if (isNaN(scoreValue)) {
            setScoreErrors(prev => ({
                ...prev,
                [playerId]: 'Please enter a valid number'
            }));
            return;
        }

        if (scoreValue % 5 !== 0) {
            setScoreErrors(prev => ({
                ...prev,
                [playerId]: 'Score must be divisible by 5'
            }));
            return;
        }

        try {
            await submitScoreMutation.mutateAsync({
                gameId: searchParams.gameId!,
                playerId,
                score: scoreValue,
            });
            setTempScores(prev => {
                const newScores = { ...prev };
                delete newScores[playerId];
                return newScores;
            });
            setScoreErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[playerId];
                return newErrors;
            });
        } catch (error) {
            console.error('Failed to submit score:', error);
            setScoreErrors(prev => ({
                ...prev,
                [playerId]: 'Failed to submit score'
            }));
        }
    };

    const handleNextRound = async () => {
        try {
            await nextRoundMutation.mutateAsync(searchParams.gameId!);
        } catch (error) {
            console.error('Failed to advance round:', error);
        }
    };

    const handleResetRound = async () => {
        try {
            await resetRoundMutation.mutateAsync({
                gameId: searchParams.gameId!,
                userId: currentUser.id,
            });
            setTempScores({});
            setScoreErrors({});
        } catch (error) {
            console.error('Failed to reset round:', error);
        }
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (e: React.DragEvent, toIndex: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === toIndex) return;

        try {
            await reorderPlayersMutation.mutateAsync({
                gameId: searchParams.gameId!,
                fromIndex: draggedIndex,
                toIndex,
                userId: currentUser.id,
            });
        } catch (error) {
            console.error('Failed to reorder players:', error);
        }
        setDraggedIndex(null);
    };

    // Computed values
    const currentUserPlayer = game.players.find((p: Player) => p.userId === currentUser.id);
    const hasCurrentUserSubmitted = currentUserPlayer?.hasSubmitted || false;
    const allPlayersSubmitted = game.players.every((p: Player) => p.hasSubmitted);
    const submittedCount = game.players.filter((p: Player) => p.hasSubmitted).length;
    const currentDealer = game.players.find((p: Player) => p.userId === game.currentDealer);
    const highestTotalScore = Math.max(...game.players.map((p: Player) => p.totalScore));

    return (
        <div className="min-h-screen relative overflow-hidden">
            <MainLayout>
                <div className="relative z-10 container mx-auto px-4 py-6">
                    <div className="flex flex-col gap-6 max-w-4xl mx-auto">

                        {/* Header */}
                        <div className="text-center space-y-4 animate-in fade-in duration-1000">
                            <Text
                                as="h1"
                                size="3xl"
                                weight="bold"
                                className="bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent text-3xl md:text-4xl lg:text-5xl"
                            >
                                {searchParams.lobbyName || "Card Game"}
                            </Text>
                            <div className="flex justify-center items-center gap-4 flex-wrap">
                                <Text size="lg" className="text-yellow-300 flex items-center gap-2">
                                    🃏 Dealer: {currentDealer?.name}
                                </Text>
                            </div>
                            {currentUserPlayer && (
                                <Text className="text-purple-300">
                                    Playing as: <span className="font-semibold">{currentUserPlayer.name}</span>
                                </Text>
                            )}
                            {game.isFinished && (
                                <Text size="xl" className="text-green-300 font-bold animate-pulse">
                                    🎉 Game Over! Winner: {game.players.find((p: Player) => p.userId === game.winner)?.name} 🎉
                                </Text>
                            )}
                        </div>

                        {/* Round Status */}
                        {!game.isFinished && (
                            <div className="text-center">
                                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20">
                                    <div className={`w-3 h-3 rounded-full ${allPlayersSubmitted ? 'bg-green-400' : 'bg-orange-400'} animate-pulse`}></div>
                                    <Text className="text-white font-medium">
                                        {allPlayersSubmitted
                                            ? "✅ All players submitted - Ready for next round!"
                                            : `⏳ Waiting for scores (${submittedCount}/${game.players.length})`
                                        }
                                    </Text>
                                </div>

                                {!hasCurrentUserSubmitted && (
                                    <div className="mt-2">
                                        <Text size="sm" className="text-yellow-300">
                                            💭 Your turn to submit a score!
                                        </Text>
                                    </div>
                                )}

                                {hasCurrentUserSubmitted && !allPlayersSubmitted && (
                                    <div className="mt-2">
                                        <Text size="sm" className="text-green-300">
                                            ✅ You've submitted! Waiting for other players...
                                        </Text>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Controls */}
                        <div className="flex flex-wrap justify-center gap-3">
                            {!game.isFinished && (
                                <>
                                    <Button
                                        colorscheme="purpleToBlue"
                                        variant="solid"
                                        size="md"
                                        onClick={() => setShowReorderMode(!showReorderMode)}
                                        className="hover:scale-105 transition-transform duration-300"
                                    >
                                        {showReorderMode ? "👁️ View Mode" : "🔧 Reorder Players"}
                                    </Button>

                                    {allPlayersSubmitted && (
                                        <Button
                                            colorscheme="greenToBlue"
                                            variant="solid"
                                            size="md"
                                            onClick={handleNextRound}
                                            disabled={nextRoundMutation.isPending}
                                            className="hover:scale-105 transition-transform duration-300 animate-pulse"
                                        >
                                            🎯 Next Round
                                        </Button>
                                    )}

                                    <Button
                                        colorscheme="cyanToBlue"
                                        variant="outline"
                                        size="md"
                                        onClick={handleResetRound}
                                        disabled={resetRoundMutation.isPending}
                                        className="hover:scale-105 transition-transform duration-300"
                                    >
                                        🔄 Reset Round
                                    </Button>
                                </>
                            )}

                            <Button
                                colorscheme="pinkToOrange"
                                variant="solid"
                                size="md"
                                onClick={handleLeaveLobby}
                                disabled={leaveLobbyMutation.isPending}
                                className="hover:scale-105 transition-transform duration-300"
                            >
                                🚪 Leave Lobby
                            </Button>

                            <Button
                                colorscheme="purpleToBlue"
                                variant="outline"
                                size="md"
                                onClick={handleBackToLobby}
                                className="hover:scale-105 transition-transform duration-300"
                            >
                                ⬅️ Back to Lobbies
                            </Button>
                        </div>

                        {/* Players List */}
                        <div className="space-y-4">
                            <div className="text-center mb-6">
                                <div className="w-32 h-1 bg-gradient-to-r from-purple-400 to-blue-400 mx-auto rounded-full"></div>
                            </div>

                            <div className="space-y-3">
                                {game.players.map((player: Player, index: number) => {
                                    const isCurrentUser = player.userId === currentUser.id;
                                    const isDealer = player.userId === game.currentDealer;
                                    const hasError = scoreErrors[player.userId];

                                    return (
                                        <div
                                            key={player.userId}
                                            draggable={showReorderMode}
                                            onDragStart={(e) => handleDragStart(e, index)}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, index)}
                                            onClick={() => !showReorderMode && setHistoryPlayer(player)}
                                            className={`group relative overflow-hidden rounded-2xl backdrop-blur-xl border p-4 shadow-lg transition-all duration-300 animate-in slide-in-from-left-6 ${
                                                player.hasSubmitted
                                                    ? 'bg-green-500/10 border-green-500/30 shadow-green-500/25'
                                                    : isCurrentUser
                                                        ? 'bg-purple-500/10 border-purple-500/30 hover:shadow-purple-500/25 ring-1 ring-purple-400/50'
                                                        : 'bg-white/10 border-white/20 hover:shadow-purple-500/25'
                                            } ${
                                                isDealer
                                                    ? 'ring-2 ring-yellow-400 bg-yellow-500/5'
                                                    : ''
                                            } ${
                                                showReorderMode ? 'cursor-move hover:scale-102' : 'cursor-pointer hover:scale-102'
                                            }`}
                                            style={{
                                                animationDelay: `${index * 100}ms`,
                                            }}
                                        >
                                            <div className="flex items-center justify-between gap-4 flex-wrap">
                                                {/* Player Info */}
                                                <div className="flex items-center gap-4">
                                                    <div className={`flex items-center justify-center w-12 h-12 rounded-full border font-bold text-lg text-white ${
                                                        isCurrentUser
                                                            ? 'bg-purple-500/30 border-purple-300/50'
                                                            : 'bg-gray-500/20 border-gray-300/30'
                                                    }`}>
                                                        {isCurrentUser ? '👤' : index + 1}
                                                    </div>

                                                    <div>
                                                        <Text size="lg" weight="semibold" className="text-white flex items-center gap-2">
                                                            {player.name}
                                                            {isCurrentUser && <span className="text-purple-400 text-sm">(You)</span>}
                                                            {isDealer && <span className="text-yellow-400">🃏</span>}
                                                            {player.hasSubmitted && <span className="text-green-400">✅</span>}
                                                            {showReorderMode && <span className="text-gray-400 text-sm">🔗</span>}
                                                            {!showReorderMode && <span className="text-blue-400 text-sm">📊</span>}
                                                        </Text>
                                                        <div className="flex items-center gap-4 text-sm">
                                                            <Text className="text-gray-400">
                                                                Total: <span className="text-white font-semibold">{player.totalScore}</span>
                                                            </Text>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Score Input - Only for current user */}
                                                {!showReorderMode && !player.hasSubmitted && isCurrentUser && !game.isFinished && (
                                                    <div className="flex flex-col gap-2 w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center gap-3">
                                                            <Input
                                                                type="text"
                                                                value={tempScores[player.userId] || ''}
                                                                onChange={(e) => handleScoreInput(player.userId, e.target.value)}
                                                                placeholder="0"
                                                                className={`w-24 text-center text-white bg-white/5 border focus:border-purple-400 placeholder-gray-400 ${
                                                                    hasError ? 'border-red-500/50' : 'border-white/30'
                                                                }`}
                                                            />
                                                            <Button
                                                                size="sm"
                                                                colorscheme="cyanToBlue"
                                                                variant="outline"
                                                                onClick={() => setCalculatorOpen(player.userId)}
                                                                className="hover:scale-110 transition-transform"
                                                            >
                                                                🧮
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                colorscheme="greenToBlue"
                                                                variant="solid"
                                                                onClick={() => handleSubmitScore(player.userId)}
                                                                disabled={!tempScores[player.userId] || !!hasError || submitScoreMutation.isPending}
                                                                className="hover:scale-110 transition-transform disabled:opacity-50"
                                                            >
                                                                Submit
                                                            </Button>
                                                        </div>

                                                        {hasError && (
                                                            <Text size="sm" className="text-red-400">
                                                                {hasError}
                                                            </Text>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Non-editable player display */}
                                                {!showReorderMode && !isCurrentUser && !player.hasSubmitted && !game.isFinished && (
                                                    <div className="text-right">
                                                        <Text size="sm" className="text-gray-400">
                                                            Waiting for player...
                                                        </Text>
                                                    </div>
                                                )}

                                                {/* Submitted score display */}
                                                {!showReorderMode && player.hasSubmitted && (
                                                    <div className="text-right">
                                                        <Text size="xl" weight="bold" className="text-green-300">
                                                            {player.currentRoundScore}
                                                        </Text>
                                                        <Text size="sm" className="text-green-400">
                                                            {isCurrentUser ? 'points' : 'submitted'}
                                                        </Text>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Game Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                            <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
                                <Text size="sm" className="text-gray-400">Current Round </Text>
                                <Text size="xl" weight="bold" className="text-purple-300">
                                    {game.currentRound}
                                </Text>
                            </div>

                            <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
                                <Text size="sm" className="text-gray-400">Submitted </Text>
                                <Text size="xl" weight="bold" className="text-blue-300">
                                    {submittedCount}/{game.players.length}
                                </Text>
                            </div>

                            <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
                                <Text size="sm" className="text-gray-400">Current Dealer </Text>
                                <Text size="xl" weight="bold" className="text-yellow-300">
                                    {currentDealer?.name?.split(' ')[0] || 'N/A'}
                                </Text>
                            </div>

                            <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
                                <Text size="sm" className="text-gray-400">Highest Total </Text>
                                <Text size="xl" weight="bold" className="text-green-300">
                                    {highestTotalScore}
                                </Text>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="text-center mt-6 p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
                            <Text className="text-gray-300 text-sm">
                                {game.isFinished
                                    ? "🎉 Game has ended! Check out the final scores above."
                                    : showReorderMode
                                        ? "🔧 Drag and drop players to change turn order. The first player in the List will be the Dealer after changing the order."
                                        : "📊 Click on any player to view their points history. Enter your round score (must be divisible by 5)."
                                }
                            </Text>
                        </div>

                        <ScoreCalculator
                            isOpen={calculatorOpen === currentUserPlayer?.userId}
                            onClose={() => setCalculatorOpen(null)}
                            onSubmit={(score) => {
                                if (currentUserPlayer) {
                                    setTempScores(prev => ({ ...prev, [currentUserPlayer.userId]: score.toString() }));
                                    setScoreErrors(prev => {
                                        const newErrors = { ...prev };
                                        delete newErrors[currentUserPlayer.userId];
                                        return newErrors;
                                    });
                                }
                            }}
                            playerName={currentUserPlayer?.name || "Player"}
                        />

                        <PlayerHistoryModal
                            isOpen={!!historyPlayer}
                            onClose={() => setHistoryPlayer(null)}
                            player={historyPlayer}
                        />
                    </div>
                </div>
            </MainLayout>
        </div>
    );
}