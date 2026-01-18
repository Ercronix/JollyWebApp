// src/presentation/pages/GamePage.tsx
import React, {useState, useEffect, useCallback} from "react";
import {Button} from "@/presentation/components/Button";
import {Input} from "@/presentation/components/input";
import {Text} from "@/presentation/components/Text";
import {ScoreCalculator} from "@/presentation/components/ScoreCalculator";
import {PlayerHistoryModal} from "@/presentation/components/PlayerHistoryModal";
import {useNavigate, useSearch} from "@tanstack/react-router";
import {MainLayout} from "@/presentation/layout/MainLayout";
import {UserModel} from "@/core/models/UserModel";
import {PlayerPointsChart} from "@/presentation/components/PlayerPointsChart";
import type {Player} from "@/types";
import {
    useGameState,
    useGameEvents,
    useSubmitScore,
    useNextRound,
    useResetRound,
    useReorderPlayers,
    useLeaveLobby,
    useSubmitWinCondition,
    useUpdateHistoryScore,
} from "@/core/api/hooks";

export type GameSearchParams = {
    gameId?: string;
    lobbyName?: string;
    lobbyId?: string;
};

export function GamePage() {
    const navigate = useNavigate();
    const searchParams = useSearch({from: '/Game'}) as GameSearchParams;
    const currentUser = UserModel.getInstance().getCurrentUser();

    const [showReorderMode, setShowReorderMode] = useState(false);
    const [tempScores, setTempScores] = useState<Record<string, string>>({});
    const [scoreErrors, setScoreErrors] = useState<Record<string, string>>({});
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [calculatorOpen, setCalculatorOpen] = useState<string | null>(null);
    const [historyPlayer, setHistoryPlayer] = useState<Player | null>(null);
    const [autoAdvance, setAutoAdvance] = useState(false);
    const [editingWinCondition, setEditingWinCondition] = useState(false);
    const [tempWinCondition, setTempWinCondition] = useState<string>('');
    const [showSettings, setShowSettings] = useState(false);

    // React Query hooks
    const {data: game, isLoading} = useGameState(searchParams.gameId);
    const submitScoreMutation = useSubmitScore();
    const nextRoundMutation = useNextRound();
    const resetRoundMutation = useResetRound();
    const reorderPlayersMutation = useReorderPlayers();
    const leaveLobbyMutation = useLeaveLobby();
    const submitWinConditionMutation = useSubmitWinCondition();
    const updateHistoryScoreMutation = useUpdateHistoryScore();

    // Subscribe to SSE events
    useGameEvents(searchParams.gameId);

    // Computed values
    const allPlayersSubmitted = game?.players.every((p: Player) => p.hasSubmitted) || false;

    const handleNextRound = useCallback(async () => {
        try {
            await nextRoundMutation.mutateAsync(searchParams.gameId!);
        } catch (error) {
            console.error('Failed to advance round:', error);
        }
    }, [nextRoundMutation, searchParams.gameId]);

    // Auto-advance to next round when all players have submitted
    useEffect(() => {
        if (autoAdvance && game && !game.isFinished && allPlayersSubmitted) {
            const timer = setTimeout(() => {
                void handleNextRound();
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [autoAdvance, game?.isFinished, allPlayersSubmitted, game, handleNextRound]);

    useEffect(() => {
        if (historyPlayer && game) {
            const updatedPlayer = game.players.find(
                (p: Player) => p.userId === historyPlayer.userId
            );
            if (updatedPlayer) {
                setHistoryPlayer(updatedPlayer);
            }
        }
    }, [game, historyPlayer, historyPlayer?.userId]);

    // Check if user is logged in
    useEffect(():void => {
        if (!currentUser) {
            void navigate({to: "/"});
        }
    }, [currentUser, navigate]);

    if (!currentUser) {
        return null;
    }

    if (isLoading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-screen">
                    <Text size="lg" className="text-gray-400">
                        Loading game...
                    </Text>
                </div>
            </MainLayout>
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

    const handleLeaveLobby = async () => {
        console.log('[handleLeaveLobby] Called');
        console.log('[handleLeaveLobby] lobbyId:', searchParams.lobbyId);
        console.log('[handleLeaveLobby] currentUser:', currentUser);

        if (!currentUser) {
            console.error('[handleLeaveLobby] No current user');
            return;
        }

        if (!searchParams.lobbyId) {
            console.warn('[handleLeaveLobby] No lobbyId, navigating anyway');
            await navigate({to: "/lobby"});
            return;
        }

        try {
            console.log('[handleLeaveLobby] Calling leaveLobby mutation');
            await leaveLobbyMutation.mutateAsync({
                lobbyId: searchParams.lobbyId,
                userId: currentUser.id,
            });
            console.log('[handleLeaveLobby] Successfully left lobby, navigating...');
            await navigate({to: "/lobby"});
        } catch (error) {
            console.error('[handleLeaveLobby] Error:', error);
            // Navigate anyway even if the API call fails
            await navigate({to: "/lobby"});
        }
    };

    const handleUpdateHistoryScore = async (roundIndex: number, newScore: number) => {
        if (!currentUser || !searchParams.gameId) {
            console.error('[handleUpdateHistoryScore] Missing required data');
            return;
        }

        try {
            await updateHistoryScoreMutation.mutateAsync({
                gameId: searchParams.gameId,
                playerId: currentUser.id,
                roundIndex,
                newScore,
            });
            console.log(`[handleUpdateHistoryScore] Successfully updated round ${roundIndex + 1} to ${newScore}`);
        } catch (error) {
            console.error('[handleUpdateHistoryScore] Error:', error);
            throw error;
        }
    };

    const handleWinConditionEdit = () => {
        setTempWinCondition(game.winCondition?.toString() || '1000');
        setEditingWinCondition(true);
    };

    const handleWinConditionSubmit = async () => {
        const value = parseInt(tempWinCondition, 10);

        if (isNaN(value) || value < 100 || value > 10000) {
            alert('Win condition must be between 100 and 10000');
            return;
        }

        try {
            await submitWinConditionMutation.mutateAsync({
                gameId: searchParams.gameId!,
                winCondition: value,
            });
            setEditingWinCondition(false);
        } catch (error) {
            console.error('Failed to update win condition:', error);
            alert('Failed to update win condition');
        }
    };

    const handleWinConditionCancel = () => {
        setEditingWinCondition(false);
        setTempWinCondition('');
    };

    const handleScoreInput = (playerId: string, value: string) => {
        const currentUserPlayer = game.players.find((p: Player) => p.userId === currentUser.id);
        if (currentUserPlayer?.userId !== playerId) {
            return;
        }

        if (value === '') {
            setTempScores(prev => ({...prev, [playerId]: value}));
            setScoreErrors(prev => {
                const newErrors = {...prev};
                delete newErrors[playerId];
                return newErrors;
            });
            return;
        }
        if (!/^(-?\d*)$/.test(value)) {
            return;
        }

        const numericValue = parseInt(value, 10);

        if (numericValue % 5 !== 0) {
            setScoreErrors(prev => ({
                ...prev,
                [playerId]: 'Score must be divisible by 5'
            }));
        } else {
            setScoreErrors(prev => {
                const newErrors = {...prev};
                delete newErrors[playerId];
                return newErrors;
            });
        }

        setTempScores(prev => ({...prev, [playerId]: value}));
    };

    const handleSubmitScore = async (playerId: string, directScore?: number) => {
        const scoreValue =
            typeof directScore === 'number'
                ? directScore
                : parseInt(tempScores[playerId] || '0');

        if (isNaN(scoreValue)) {
            setScoreErrors(prev => ({
                ...prev,
                [playerId]: 'Please enter a valid number',
            }));
            return;
        }

        if (scoreValue % 5 !== 0) {
            setScoreErrors(prev => ({
                ...prev,
                [playerId]: 'Score must be divisible by 5',
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
                const next = {...prev};
                delete next[playerId];
                return next;
            });

            setScoreErrors(prev => {
                const next = {...prev};
                delete next[playerId];
                return next;
            });
        } catch (error) {
            console.error('Failed to submit score:', error);
            setScoreErrors(prev => ({
                ...prev,
                [playerId]: 'Failed to submit score',
            }));
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
    const submittedCount = game.players.filter((p: Player) => p.hasSubmitted).length;
    const currentDealer = game.players.find((p: Player) => p.userId === game.currentDealer);
    const highestTotalScore = Math.max(...game.players.map((p: Player) => p.totalScore));

    return (
        <div className="min-h-screen relative overflow-hidden">
            <MainLayout>
                <div className="relative z-10 container mx-auto px-4 py-6">
                    <div className="flex flex-col gap-3 max-w-4xl mx-auto">
                        {/* Header */}
                        <div className="relative flex items-center justify-between w-full max-w-4xl mx-auto">
                            <button
                                onClick={() => navigate({to: "/lobby"})}
                                className="flex items-center gap-2 text-purple-200 hover:text-white transition-colors
                                focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-lg p-2 z-10"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                                </svg>
                                <span className="font-medium">Back</span>
                            </button>

                            <Text as="h1" size="3xl" weight="bold"
                                  className="absolute left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-400 via-white-300 to-blue-400 bg-clip-text text-transparent text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-center whitespace-nowrap">
                                {searchParams.lobbyName || "Card Game"}
                            </Text>

                            <div className="w-[88px]"/>
                        </div>

                        {/* Win Condition Display */}
                        {!game.isFinished && (
                            <div className="flex justify-center">
                                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-white-500/10 to-orange-500/10 backdrop-blur-xl border border-gray-600">
                                    <div>
                                        <Text size="sm" className="text-yellow-200/70">Win Condition: </Text>
                                        <Text size="lg" weight="bold" className="text-yellow-300">
                                            {game.winCondition || 1000}
                                        </Text>
                                    </div>
                                </div>
                            </div>
                        )}

                        {game.isFinished && (
                            <Text size="xl" className="text-green-300 font-bold animate-pulse text-center">
                                Game Over! Winner: {game.players.find((p: Player) => p.userId === game.winner)?.name}
                            </Text>
                        )}

                        {/* Settings Section */}
                        {!game.isFinished && (
                            <div className="flex flex-col items-center gap-4">
                                <button
                                    onClick={() => setShowSettings(!showSettings)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105"
                                >
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <Text className="text-white font-medium">Settings</Text>
                                    <svg className={`w-4 h-4 text-white transition-transform duration-300 ${showSettings ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                <div className={`w-full max-w-md overflow-hidden transition-all duration-500 ease-in-out ${
                                    showSettings ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                }`}>
                                    <div className="p-4 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl space-y-3">
                                        {/* Auto-advance */}
                                        <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                                            <Text className="text-white text-sm font-medium">Auto-advance rounds</Text>
                                            <input
                                                type="checkbox"
                                                checked={autoAdvance}
                                                onChange={(e) => setAutoAdvance(e.target.checked)}
                                                className="w-4 h-4 rounded border-white/30 bg-white/5 text-purple-500 focus:ring-2 focus:ring-purple-400 cursor-pointer"
                                            />
                                        </label>

                                        {/* Win Condition Edit */}
                                        {!editingWinCondition ? (
                                            <button
                                                onClick={handleWinConditionEdit}
                                                disabled={allPlayersSubmitted}
                                                className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Text className="text-white text-sm font-medium">Edit Win Condition</Text>
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                        ) : (
                                            <div className="p-3 rounded-lg bg-white/5 space-y-2">
                                                <Text className="text-white text-sm font-medium">Win Condition</Text>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        value={tempWinCondition}
                                                        onChange={(e) => setTempWinCondition(e.target.value)}
                                                        placeholder="1000"
                                                        min="100"
                                                        max="10000"
                                                        step="50"
                                                        className="flex-1 text-center text-white bg-white/10 border border-yellow-500/30 focus:border-yellow-400 placeholder-gray-400"
                                                    />
                                                    <Button size="sm" colorscheme="greenToBlue" variant="solid"
                                                            onClick={handleWinConditionSubmit}
                                                            disabled={submitWinConditionMutation.isPending}>✓</Button>
                                                    <Button size="sm" colorscheme="pinkToOrange" variant="outline"
                                                            onClick={handleWinConditionCancel}>✕</Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Reorder Players */}
                                        <button
                                            onClick={() => setShowReorderMode(!showReorderMode)}
                                            className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                                        >
                                            <Text className="text-white text-sm font-medium">
                                                {showReorderMode ? "Exit Reorder Mode" : "Reorder Players"}
                                            </Text>
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                            </svg>
                                        </button>

                                        {/* Reset Round */}
                                        <button
                                            onClick={() => void handleResetRound()}
                                            disabled={resetRoundMutation.isPending}
                                            className="w-full flex items-center justify-between p-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-all disabled:opacity-50"
                                        >
                                            <Text className="text-red-300 text-sm font-medium">Reset Round</Text>
                                            <svg className="w-4 h-4 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Round Status */}
                        {!game.isFinished && (
                            <div className="text-center space-y-4">
                                {submittedCount > 0 && (
                                    <div>
                                        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20">
                                            <div className={`w-3 h-3 rounded-full ${allPlayersSubmitted ? 'bg-green-400' : 'bg-orange-400'} animate-pulse`}></div>
                                            <Text className="text-white font-medium">
                                                {allPlayersSubmitted ? "✅ All players submitted" : `⏳ Waiting for scores (${submittedCount}/${game.players.length})`}
                                            </Text>
                                        </div>
                                    </div>
                                )}

                                {hasCurrentUserSubmitted && !allPlayersSubmitted && (
                                    <div className="mt-2">
                                        <Text size="sm" className="text-green-300">✅ You've submitted! Waiting for other players...</Text>
                                    </div>
                                )}

                                {allPlayersSubmitted && !autoAdvance && (
                                    <Button colorscheme="greenToBlue" variant="solid" size="md"
                                            onClick={handleNextRound}
                                            disabled={nextRoundMutation.isPending}
                                            className="hover:scale-105 transition-transform duration-300 animate-pulse">
                                        Next Round
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Score Input Box */}
                        {!game.isFinished && !hasCurrentUserSubmitted && (
                            <div className="flex justify-center">
                                <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                                    <Text className="text-center text-white font-semibold mb-4">Enter Your Score</Text>
                                    <div className="flex items-center justify-center gap-3">
                                        <Button size="md" colorscheme="cyanToBlue" variant="outline"
                                                onClick={() => setCalculatorOpen(currentUser.id)}
                                                className="hover:scale-110 transition-transform">🧮</Button>
                                        <Input
                                            type="text"
                                            value={tempScores[currentUser.id] || ''}
                                            onChange={(e) => handleScoreInput(currentUser.id, e.target.value)}
                                            placeholder="0"
                                            className="w-16 text-center text-white text-lg bg-white/5 border focus:border-purple-400 placeholder-gray-400 h-11"
                                        />
                                        <Button size="md" colorscheme="greenToBlue" variant="solid"
                                                onClick={() => handleSubmitScore(currentUser.id)}
                                                disabled={!tempScores[currentUser.id] || submitScoreMutation.isPending}
                                                className="border-white/20 border hover:scale-110 transition-transform disabled:opacity-50 h-11">Submit</Button>
                                    </div>
                                    {scoreErrors[currentUser.id] && (
                                        <Text size="sm" className="text-red-400 text-center mt-2">{scoreErrors[currentUser.id]}</Text>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Players List */}
                        <div className="space-y-4">
                            <div className="text-center mb-6">
                                <div className="w-32 h-1 bg-gradient-to-r from-purple-400 to-blue-400 mx-auto rounded-full"></div>
                            </div>

                            <div className="space-y-3">
                                {game.players.map((player: Player, index: number) => {
                                    const isCurrentUser = player.userId === currentUser.id;
                                    const isDealer = player.userId === game.currentDealer;

                                    return (
                                        <div
                                            key={player.userId}
                                            draggable={showReorderMode}
                                            onDragStart={(e) => handleDragStart(e, index)}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, index)}
                                            onClick={() => !showReorderMode && setHistoryPlayer(player)}
                                            className={`group relative overflow-hidden rounded-2xl backdrop-blur-xl border p-4 shadow-lg transition-all duration-300 ${
                                                player.hasSubmitted
                                                    ? 'bg-green-500/10 border-green-500/30 shadow-green-500/25'
                                                    : isCurrentUser
                                                        ? 'bg-purple-500/10 border-purple-500/30 hover:shadow-purple-500/25 ring-1 ring-purple-400/50'
                                                        : 'bg-white/10 border-white/20 hover:shadow-purple-500/25'
                                            } ${isDealer ? 'ring-2 ring-yellow-400 bg-yellow-500/5' : ''} ${showReorderMode ? 'cursor-move hover:scale-102' : 'cursor-pointer hover:scale-102'}`}
                                        >
                                            <div className="flex items-center justify-between gap-4 flex-wrap">
                                                <div className="flex items-center gap-4">
                                                    <div className={`flex items-center justify-center w-12 h-12 rounded-full border font-bold text-lg text-white ${
                                                        isCurrentUser ? 'bg-purple-500/30 border-purple-300/50' : 'bg-gray-500/20 border-gray-300/30'
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
                                                        </Text>
                                                        <div className="flex items-center gap-4 text-sm">
                                                            <Text className="text-gray-400">
                                                                Total: <span className="text-white font-semibold">{player.totalScore}</span>
                                                            </Text>
                                                        </div>
                                                    </div>
                                                </div>

                                                {!showReorderMode && !isCurrentUser && !player.hasSubmitted && !game.isFinished && (
                                                    <div className="text-right">
                                                        <Text size="sm" className="text-gray-400">Waiting for player...</Text>
                                                    </div>
                                                )}

                                                {!showReorderMode && player.hasSubmitted && (
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-right">
                                                            <Text size="xl" weight="bold" className="text-green-300">{player.currentRoundScore}</Text>
                                                            <Text size="sm" className="text-green-400">{isCurrentUser ? 'points' : 'submitted'}</Text>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {game.players.length > 0 && (
                            <PlayerPointsChart players={game.players} currentRound={game.currentRound} />
                        )}

                        {/* Game Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                            <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
                                <Text size="sm" className="text-gray-400">Current Round </Text>
                                <Text size="xl" weight="bold" className="text-purple-300">{game.currentRound}</Text>
                            </div>

                            <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
                                <Text size="sm" className="text-gray-400">Submitted </Text>
                                <Text size="xl" weight="bold" className="text-blue-300">{submittedCount}/{game.players.length}</Text>
                            </div>

                            <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
                                <Text size="sm" className="text-gray-400">Current Dealer </Text>
                                <Text size="xl" weight="bold" className="text-yellow-300">{currentDealer?.name?.split(' ')[0] || 'N/A'}</Text>
                            </div>

                            <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
                                <Text size="sm" className="text-gray-400">Highest Total </Text>
                                <Text size="xl" weight="bold" className="text-green-300">{highestTotalScore}</Text>
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

                        <Button colorscheme="pinkToOrange" variant="outline" size="md"
                                onClick={handleLeaveLobby}
                                disabled={leaveLobbyMutation.isPending}
                                className="hover:scale-105 transition-transform duration-300">
                            Quit Game
                        </Button>

                        <ScoreCalculator
                            isOpen={calculatorOpen === currentUserPlayer?.userId}
                            onClose={() => setCalculatorOpen(null)}
                            onSubmit={(score) => {
                                if (currentUserPlayer) {
                                    void handleSubmitScore(currentUserPlayer.userId, score);
                                }
                            }}
                            playerName={currentUserPlayer?.name || "Player"}
                        />

                        <PlayerHistoryModal
                            isOpen={!!historyPlayer}
                            onClose={() => setHistoryPlayer(null)}
                            player={historyPlayer}
                            currentUserId={currentUser.id}
                            gameId={searchParams.gameId}
                            onUpdateScore={handleUpdateHistoryScore}
                        />
                    </div>
                </div>
            </MainLayout>
        </div>
    );
}