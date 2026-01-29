// src/presentation/pages/GamePage/GamePage.tsx
import React, {useState, useEffect, useCallback, useMemo} from "react";
import {Button} from "@/presentation/components/Button";
import {Text} from "@/presentation/components/Text";
import {ScoreCalculator} from "@/presentation/components/ScoreCalculator";
import {PlayerHistoryModal} from "@/presentation/components/PlayerHistoryModal";
import {useNavigate, useSearch} from "@tanstack/react-router";
import {MainLayout} from "@/presentation/layout/MainLayout";
import {UserModel} from "@/core/models/UserModel";
import {PlayerPointsChart} from "@/presentation/components/PlayerPointsChart";
import {PrivateLobbyInfo} from "@/presentation/components/PrivateLobbyInfo";
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
import {GameHeader} from "./components/GameHeader";
import {WinConditionDisplay} from "./components/WinConditionDisplay";
import {GameSettings} from "./components/GameSettings";
import {RoundStatus} from "./components/RoundStatus";
import {ScoreInput} from "./components/ScoreInput";
import {PlayerCard} from "./components/PlayerCard";
import {GameStats} from "./components/GameStats";

export type GameSearchParams = {
    accessCode?: string;
    gameId?: string;
    lobbyName?: string;
    lobbyId?: string;
};

export function GamePage() {
    const navigate = useNavigate();
    const searchParams = useSearch({from: '/Game'}) as GameSearchParams;
    const currentUser = UserModel.getInstance().getCurrentUser();

    // All state declarations
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

    // All React Query hooks
    const {data: game, isLoading} = useGameState(searchParams.gameId);
    const submitScoreMutation = useSubmitScore();
    const nextRoundMutation = useNextRound();
    const resetRoundMutation = useResetRound();
    const reorderPlayersMutation = useReorderPlayers();
    const leaveLobbyMutation = useLeaveLobby();
    const submitWinConditionMutation = useSubmitWinCondition();
    const updateHistoryScoreMutation = useUpdateHistoryScore();

    // SSE subscription
    useGameEvents(searchParams.gameId);

    // All memoized computed values
    const allPlayersSubmitted = useMemo(
        () => game?.players.every((p: Player) => p.hasSubmitted) || false,
        [game?.players]
    );

    const currentUserPlayer = useMemo(
        () => currentUser && game?.players ? game.players.find((p: Player) => p.userId === currentUser.id) : undefined,
        [game?.players, currentUser]
    );

    const hasCurrentUserSubmitted = useMemo(
        () => currentUserPlayer?.hasSubmitted || false,
        [currentUserPlayer?.hasSubmitted]
    );

    const submittedCount = useMemo(
        () => game?.players.filter((p: Player) => p.hasSubmitted).length || 0,
        [game?.players]
    );

    const currentDealer = useMemo(
        () => game?.players.find((p: Player) => p.userId === game?.currentDealer),
        [game?.players, game?.currentDealer]
    );

    const highestTotalScore = useMemo(
        () => game?.players.length ? Math.max(...game.players.map((p: Player) => p.totalScore)) : 0,
        [game?.players]
    );

    const handleNextRound = useCallback(async () => {
        if (!searchParams.gameId) return;
        try {
            await nextRoundMutation.mutateAsync(searchParams.gameId);
        } catch (error) {
            console.error('Failed to advance round:', error);
        }
    }, [nextRoundMutation, searchParams.gameId]);

    const handleLeaveLobby = useCallback(async () => {
        if (!currentUser) return;
        if (!searchParams.lobbyId) {
            await navigate({to: "/lobby"});
            return;
        }

        try {
            await leaveLobbyMutation.mutateAsync({
                lobbyId: searchParams.lobbyId,
                userId: currentUser.id,
            });
            await navigate({to: "/lobby"});
        } catch (error) {
            console.error('[handleLeaveLobby] Error:', error);
            await navigate({to: "/lobby"});
        }
    }, [currentUser, searchParams.lobbyId, leaveLobbyMutation, navigate]);

    const handleUpdateHistoryScore = useCallback(async (roundIndex: number, newScore: number) => {
        if (!currentUser || !searchParams.gameId) return;

        try {
            await updateHistoryScoreMutation.mutateAsync({
                gameId: searchParams.gameId,
                playerId: currentUser.id,
                roundIndex,
                newScore,
            });
        } catch (error) {
            console.error('[handleUpdateHistoryScore] Error:', error);
            throw error;
        }
    }, [currentUser, searchParams.gameId, updateHistoryScoreMutation]);

    const handleWinConditionEdit = useCallback(() => {
        setTempWinCondition(game?.winCondition?.toString() || '1000');
        setEditingWinCondition(true);
    }, [game?.winCondition]);

    const handleWinConditionSubmit = useCallback(async () => {
        if (!searchParams.gameId) return;

        const value = parseInt(tempWinCondition, 10);
        if (isNaN(value) || value < 100 || value > 10000) {
            alert('Win condition must be between 100 and 10000');
            return;
        }

        try {
            await submitWinConditionMutation.mutateAsync({
                gameId: searchParams.gameId,
                winCondition: value,
            });
            setEditingWinCondition(false);
        } catch (error) {
            console.error('Failed to update win condition:', error);
            alert('Failed to update win condition');
        }
    }, [tempWinCondition, submitWinConditionMutation, searchParams.gameId]);

    const handleWinConditionCancel = useCallback(() => {
        setEditingWinCondition(false);
        setTempWinCondition('');
    }, []);

    const handleScoreInput = useCallback((playerId: string, value: string) => {
        if (currentUserPlayer?.userId !== playerId) return;

        if (value === '') {
            setTempScores(prev => ({...prev, [playerId]: value}));
            setScoreErrors(prev => {
                const newErrors = {...prev};
                delete newErrors[playerId];
                return newErrors;
            });
            return;
        }
        if (!/^(-?\d*)$/.test(value)) return;

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
    }, [currentUserPlayer?.userId]);

    const handleSubmitScore = useCallback(async (playerId: string, directScore?: number) => {
        if (!searchParams.gameId) return;

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
                gameId: searchParams.gameId,
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
    }, [tempScores, submitScoreMutation, searchParams.gameId]);

    const handleResetRound = useCallback(async () => {
        if (!currentUser || !searchParams.gameId) return;

        try {
            await resetRoundMutation.mutateAsync({
                gameId: searchParams.gameId,
                userId: currentUser.id,
            });
            setTempScores({});
            setScoreErrors({});
        } catch (error) {
            console.error('Failed to reset round:', error);
        }
    }, [resetRoundMutation, searchParams.gameId, currentUser]);

    const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent, toIndex: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === toIndex || !currentUser || !searchParams.gameId) return;

        try {
            await reorderPlayersMutation.mutateAsync({
                gameId: searchParams.gameId,
                fromIndex: draggedIndex,
                toIndex,
                userId: currentUser.id,
            });
        } catch (error) {
            console.error('Failed to reorder players:', error);
        }
        setDraggedIndex(null);
    }, [draggedIndex, reorderPlayersMutation, searchParams.gameId, currentUser]);

    // All side effects
    useEffect(() => {
        if (!autoAdvance || !allPlayersSubmitted || game?.isFinished) return;
        const timer = setTimeout(handleNextRound, 1500);
        return () => clearTimeout(timer);
    }, [autoAdvance, allPlayersSubmitted, game?.isFinished, handleNextRound]);

    useEffect(() => {
        if (historyPlayer && game) {
            const updatedPlayer = game.players.find(
                (p: Player) => p.userId === historyPlayer.userId
            );
            if (updatedPlayer) {
                setHistoryPlayer(updatedPlayer);
            }
        }
    }, [game, historyPlayer]);

    // Early returns AFTER all hooks
    if (!currentUser) {
        void navigate({to: "/"});
        return null;
    }

    if (isLoading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-screen">
                    <Text size="lg" className="text-gray-400">Loading game...</Text>
                </div>
            </MainLayout>
        );
    }

    if (!game || !searchParams.gameId) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Text size="lg" className="text-red-400">Game not found</Text>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            <MainLayout>
                <div className="relative z-10 container mx-auto px-4 py-6">
                    <div className="flex flex-col gap-3 max-w-4xl mx-auto">
                        <GameHeader lobbyName={searchParams.lobbyName}/>


                        {searchParams.accessCode && (
                            <div>
                            <Text as="h1" size="sm" weight="bold" className="bg-gradient-to-r from-purple-400 via-white-300 to-blue-400 bg-clip-text text-transparent text-center whitespace-nowrap">
                                (private Lobby)
                            </Text>
                            </div>)}
                        <WinConditionDisplay
                            isFinished={game.isFinished}
                            winCondition={game.winCondition}
                            winner={game.winner}
                            players={game.players}
                        />

                        {!game.isFinished && (
                            <GameSettings
                                showSettings={showSettings}
                                setShowSettings={setShowSettings}
                                autoAdvance={autoAdvance}
                                setAutoAdvance={setAutoAdvance}
                                editingWinCondition={editingWinCondition}
                                tempWinCondition={tempWinCondition}
                                setTempWinCondition={setTempWinCondition}
                                allPlayersSubmitted={allPlayersSubmitted}
                                showReorderMode={showReorderMode}
                                setShowReorderMode={setShowReorderMode}
                                isPending={submitWinConditionMutation.isPending || resetRoundMutation.isPending}
                                onWinConditionEdit={handleWinConditionEdit}
                                onWinConditionSubmit={handleWinConditionSubmit}
                                onWinConditionCancel={handleWinConditionCancel}
                                onResetRound={handleResetRound}
                            />
                        )}

                        {!game.isFinished && (
                            <RoundStatus
                                submittedCount={submittedCount}
                                totalPlayers={game.players.length}
                                allPlayersSubmitted={allPlayersSubmitted}
                                hasCurrentUserSubmitted={hasCurrentUserSubmitted}
                                autoAdvance={autoAdvance}
                                isPending={nextRoundMutation.isPending}
                                onNextRound={handleNextRound}
                            />
                        )}

                        {!game.isFinished && !hasCurrentUserSubmitted && currentUserPlayer && !showReorderMode && (
                            <ScoreInput
                                currentUserId={currentUser.id}
                                tempScore={tempScores[currentUser.id] || ''}
                                scoreError={scoreErrors[currentUser.id]}
                                isPending={submitScoreMutation.isPending}
                                onScoreInput={(value) => handleScoreInput(currentUser.id, value)}
                                onCalculatorOpen={() => setCalculatorOpen(currentUser.id)}
                                onSubmit={() => handleSubmitScore(currentUser.id)}
                            />
                        )}

                        <div className="space-y-4">
                            <div className="text-center mb-6">
                                <div
                                    className="w-32 h-1 bg-gradient-to-r from-purple-400 to-blue-400 mx-auto rounded-full"></div>
                            </div>

                            <div className="space-y-3">
                                {game.players.map((player: Player, index: number) => {
                                    const isCurrentUser = player.userId === currentUser.id;
                                    const isDealer = player.userId === game.currentDealer;

                                    return (
                                        <PlayerCard
                                            key={player.userId}
                                            player={player}
                                            index={index}
                                            isCurrentUser={isCurrentUser}
                                            isDealer={isDealer}
                                            isFinished={game.isFinished}
                                            showReorderMode={showReorderMode}
                                            onDragStart={handleDragStart}
                                            onDragOver={handleDragOver}
                                            onDrop={handleDrop}
                                            onClick={() => setHistoryPlayer(player)}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {game.players.length > 0 && (
                            <PlayerPointsChart players={game.players} currentRound={game.currentRound}/>
                        )}

                        <GameStats
                            currentRound={game.currentRound}
                            submittedCount={submittedCount}
                            totalPlayers={game.players.length}
                            dealerName={currentDealer?.name}
                            highestScore={highestTotalScore}
                        />

                        <div
                            className="text-center mt-6 p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
                            <Text className="text-gray-300 text-sm">
                                {game.isFinished
                                    ? "🎉 Game has ended! Check out the final scores above."
                                    : showReorderMode
                                        ? "🔧 Drag and drop players to change turn order. The first player in the List will be the Dealer after changing the order."
                                        : "📊 Click on any player to view their points history. Enter your round score (must be divisible by 5)."
                                }
                            </Text>
                        </div>

                        {searchParams.accessCode && (
                            <PrivateLobbyInfo
                                accessCode={searchParams.accessCode}
                                lobbyName={searchParams.lobbyName || "Private Game"}
                            />
                        )}

                        <Button colorscheme="pinkToOrange" variant="outline" size="md"
                                onClick={handleLeaveLobby}
                                disabled={leaveLobbyMutation.isPending}
                                className="hover:scale-105 transition-transform duration-300">
                            Quit Game
                        </Button>

                        {currentUserPlayer && (
                            <ScoreCalculator
                                isOpen={calculatorOpen === currentUserPlayer.userId}
                                onClose={() => setCalculatorOpen(null)}
                                onSubmit={(score) => {
                                    void handleSubmitScore(currentUserPlayer.userId, score);
                                }}
                                playerName={currentUserPlayer.name || "Player"}
                            />
                        )}

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