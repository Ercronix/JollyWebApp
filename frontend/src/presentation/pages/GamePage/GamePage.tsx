// src/presentation/pages/GamePage/GamePage.tsx
import {useState, useCallback, useMemo} from "react";
import {Button} from "@/presentation/components/Button";
import {Text} from "@/presentation/components/Text";
import {Input} from "@/presentation/components/input";
import {ScoreCalculator} from "@/presentation/components/ScoreCalculator";
import {PlayerHistoryModal} from "@/presentation/components/PlayerHistoryModal";
import {Navigate, useNavigate, useSearch} from "@tanstack/react-router";
import {MainLayout} from "@/presentation/layout/MainLayout";
import {UserModel} from "@/core/models/UserModel";
import {PlayerPointsChart} from "@/presentation/components/PlayerPointsChart";
import {PrivateLobbyInfo} from "@/presentation/components/PrivateLobbyInfo";
import type {GameEvent, Player} from "@/types";
import { useQueryClient } from "@tanstack/react-query";
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
    useUpdateHistoryScoreForPlayer,
    useAddPlayerToGame,
    useRemovePlayerFromGame,
    useSubmitScoreForPlayer,
    queryKeys,
} from "@/core/api/hooks";
import {GameHeader} from "./components/GameHeader";
import {WinnerCard} from "./components/WinnerCard";
import {RoundStatus} from "./components/RoundStatus";
import {ScoreInput} from "./components/ScoreInput";
import {PlayerCard} from "./components/PlayerCard";
import {GameStats} from "./components/GameStats";
import {AdminPanel} from "@/presentation/components/AdminPanel";
import {Sheet} from "@/presentation/components/Sheet";
import {useAutoAdvance, useAutoAdvanceSetting} from "@/core/hooks/useAutoAdvance";
import {useRefetchOnReturn} from "@/core/hooks/useRefetchOnReturn";
import {isScoreInput, parseScore, validateScore, validateWinCondition} from "@/core/scores";
import {useToast} from "@/presentation/components/Toast/useToast";
import {DeleteConfirmationModal} from "@/presentation/components/DeleteConfirmationModal";
import {logger} from "@/utils/logger";
import {canEditOthersHistory, deriveGameState} from "./gameState";

export type GameSearchParams = {
    accessCode?: string;
    gameId?: string;
    lobbyName?: string;
    lobbyId?: string;
};

export function GamePage() {
    const searchParams = useSearch({from: '/Game'}) as GameSearchParams;
    const gameId = searchParams.gameId;
    const navigate = useNavigate();
    const toast = useToast();
    const currentUser = UserModel.getInstance().getCurrentUser();

    // UI state
    const [showReorderMode, setShowReorderMode] = useState(false);
    const [scoreInput, setScoreInput] = useState('');
    const [scoreError, setScoreError] = useState<string | undefined>();
    const [calculatorOpen, setCalculatorOpen] = useState(false);
    const [historyPlayerId, setHistoryPlayerId] = useState<string | null>(null);
    const [playerToRemove, setPlayerToRemove] = useState<Player | null>(null);
    const [autoAdvance, setAutoAdvance] = useAutoAdvanceSetting(gameId);
    const [editingWinCondition, setEditingWinCondition] = useState(false);
    const [tempWinCondition, setTempWinCondition] = useState<string>('');
    const [showSettings, setShowSettings] = useState(false);
    const [isAdminMode, setIsAdminMode] = useState(false);

    // Server state
    const {data: game, isLoading} = useGameState(gameId);
    const submitScoreMutation = useSubmitScore();
    const nextRoundMutation = useNextRound();
    const [confirmLeave, setConfirmLeave] = useState(false);
    const resetRoundMutation = useResetRound();
    const reorderPlayersMutation = useReorderPlayers();
    const leaveLobbyMutation = useLeaveLobby();
    const submitWinConditionMutation = useSubmitWinCondition();
    const updateHistoryScoreMutation = useUpdateHistoryScore();
    const updateHistoryScoreForPlayerMutation = useUpdateHistoryScoreForPlayer();
    const addPlayerMutation = useAddPlayerToGame();
    const removePlayerMutation = useRemovePlayerFromGame();
    const submitScoreForPlayerMutation = useSubmitScoreForPlayer();
    const queryClient = useQueryClient();

    // Live updates, plus a re-sync whenever the user comes back to the tab
    useGameEvents(gameId, useCallback((event: GameEvent) => {
        toast.success(event.ownerId === currentUser?.id
            ? 'You are now the lobby admin'
            : `${event.ownerName ?? 'Another player'} is now the lobby admin`);
    }, [toast, currentUser?.id]));
    useRefetchOnReturn(useCallback(() => {
        if (gameId) void queryClient.invalidateQueries({queryKey: queryKeys.game(gameId)});
    }, [queryClient, gameId]));

    const {
        allPlayersSubmitted,
        submittedCount,
        activePlayerCount,
        currentUserPlayer,
        hasCurrentUserSubmitted,
        currentDealer,
        isOwner,
        isLastLobbyPlayer,
        hasScores,
    } = useMemo(() => deriveGameState(game, currentUser?.id), [game, currentUser?.id]);

    // Follow the live game state, so the modal shows updated scores
    const historyPlayer = game?.players.find(p => p.userId === historyPlayerId) ?? null;

    const showError = useCallback((fallback: string, error: unknown) => {
        logger.error(fallback, error);
        toast.error(error instanceof Error && error.message ? error.message : fallback);
    }, [toast]);

    const advanceRound = useCallback(async ({silent}: {silent: boolean}) => {
        if (!gameId) return;
        try {
            await nextRoundMutation.mutateAsync(gameId);
        } catch (error) {
            // With auto-advance, every client requests the next round and all but one lose the race
            if (silent) {
                logger.debug('Auto-advance skipped:', error);
            } else {
                showError('Failed to start the next round', error);
            }
        }
    }, [nextRoundMutation, gameId, showError]);

    const handleNextRound = useCallback(() => advanceRound({silent: false}), [advanceRound]);

    useAutoAdvance({
        enabled: autoAdvance && !game?.isFinished,
        ready: allPlayersSubmitted,
        onAdvance: useCallback(() => void advanceRound({silent: true}), [advanceRound]),
    });

    const handleLeaveLobby = useCallback(async () => {
        if (searchParams.lobbyId) {
            try {
                await leaveLobbyMutation.mutateAsync({lobbyId: searchParams.lobbyId});
            } catch (error) {
                logger.error('Failed to leave lobby:', error);
            }
        }
        await navigate({to: "/lobby"});
    }, [searchParams.lobbyId, leaveLobbyMutation, navigate]);

    const handleUpdateHistoryScore = useCallback(async (roundIndex: number, newScore: number) => {
        if (!gameId || !historyPlayerId) return;
        if (historyPlayerId === currentUser?.id) {
            await updateHistoryScoreMutation.mutateAsync({gameId, roundIndex, newScore});
        } else {
            await updateHistoryScoreForPlayerMutation.mutateAsync({gameId, playerId: historyPlayerId, roundIndex, newScore});
        }
    }, [gameId, historyPlayerId, currentUser?.id, updateHistoryScoreMutation, updateHistoryScoreForPlayerMutation]);

    const handleWinConditionEdit = useCallback(() => {
        setTempWinCondition(game?.winCondition?.toString() || '1000');
        setEditingWinCondition(true);
    }, [game?.winCondition]);

    const handleWinConditionSubmit = useCallback(async () => {
        if (!gameId) return;

        const value = Number(tempWinCondition);
        const error = validateWinCondition(value);
        if (error) {
            toast.error(error);
            return;
        }

        try {
            await submitWinConditionMutation.mutateAsync({gameId, winCondition: value});
            setEditingWinCondition(false);
        } catch (error) {
            showError('Failed to update win condition', error);
        }
    }, [tempWinCondition, submitWinConditionMutation, gameId, toast, showError]);

    const handleWinConditionCancel = useCallback(() => {
        setEditingWinCondition(false);
        setTempWinCondition('');
    }, []);

    const handleScoreInput = useCallback((value: string) => {
        if (!isScoreInput(value)) return;
        setScoreInput(value);
        // Only complain about a finished number, not while typing "" or "-"
        const score = parseScore(value);
        setScoreError(Number.isNaN(score) ? undefined : validateScore(score) ?? undefined);
    }, []);

    const handleSubmitScore = useCallback(async (directScore?: number) => {
        if (!gameId) return;

        // An empty input submits 0
        const score = typeof directScore === 'number' ? directScore : parseScore(scoreInput || '0');
        const error = validateScore(score);
        if (error) {
            setScoreError(error);
            return;
        }

        try {
            await submitScoreMutation.mutateAsync({gameId, score});
            setScoreInput('');
            setScoreError(undefined);
        } catch (error) {
            logger.error('Failed to submit score:', error);
            setScoreError(error instanceof Error && error.message ? error.message : 'Failed to submit score');
        }
    }, [scoreInput, submitScoreMutation, gameId]);

    const handleResetRound = useCallback(async () => {
        if (!gameId) return;

        try {
            await resetRoundMutation.mutateAsync({gameId});
            setScoreInput('');
            setScoreError(undefined);
        } catch (error) {
            showError('Failed to reset the round', error);
        }
    }, [resetRoundMutation, gameId, showError]);

    const handleMovePlayer = useCallback(async (fromIndex: number, toIndex: number) => {
        if (!gameId) return;

        try {
            await reorderPlayersMutation.mutateAsync({gameId, fromIndex, toIndex});
        } catch (error) {
            showError('Failed to reorder players', error);
        }
    }, [reorderPlayersMutation, gameId, showError]);

    const handleToggleAdminMode = useCallback(() => {
        setIsAdminMode(prev => !prev);
    }, []);

    const handleAddPlayer = useCallback(async (playerName: string) => {
        if (!gameId) return;

        try {
            await addPlayerMutation.mutateAsync({gameId, playerName});
        } catch (error) {
            showError('Failed to add player', error);
        }
    }, [addPlayerMutation, gameId, showError]);

    const handleRemovePlayer = useCallback((playerId: string) => {
        setPlayerToRemove(game?.players.find(p => p.userId === playerId) ?? null);
    }, [game?.players]);

    const confirmRemovePlayer = useCallback(async () => {
        if (!gameId || !playerToRemove) return;

        try {
            await removePlayerMutation.mutateAsync({gameId, playerId: playerToRemove.userId});
            setPlayerToRemove(null);
        } catch (error) {
            showError('Failed to remove player', error);
        }
    }, [removePlayerMutation, gameId, playerToRemove, showError]);

    const handleSubmitScoreForPlayer = useCallback(async (playerId: string, score: number) => {
        if (!gameId) return;

        try {
            await submitScoreForPlayerMutation.mutateAsync({gameId, playerId, score});
        } catch (error) {
            showError('Failed to submit score', error);
        }
    }, [submitScoreForPlayerMutation, gameId, showError]);

    // Early returns AFTER all hooks
    if (!currentUser) {
        return <Navigate to="/"/>;
    }

    if (isLoading) {
        return (
            <MainLayout hideFooter>
                <div className="flex items-center justify-center min-h-[60dvh]">
                    <Text size="lg" className="text-fg-muted">Loading game...</Text>
                </div>
            </MainLayout>
        );
    }

    if (!game || !gameId) {
        return (
            <MainLayout hideFooter>
                <div className="flex items-center justify-center min-h-[60dvh]">
                    <Text size="lg" className="text-bad font-semibold">Game not found</Text>
                </div>
            </MainLayout>
        );
    }

    const canSubmit = !game.isFinished && !hasCurrentUserSubmitted && !!currentUserPlayer && !showReorderMode;
    const showNextRound = !game.isFinished && allPlayersSubmitted && !autoAdvance;
    const settingRow = "w-full min-h-12 flex items-center justify-between gap-3 px-4 rounded-xl bg-surface-2 hover:bg-[#2a3832] text-left text-fg text-[15px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

    return (
        <MainLayout hideFooter>
            {/* Room for the fixed bottom bar */}
            <div className="flex flex-col gap-3 pb-44">
                <GameHeader
                    lobbyName={searchParams.lobbyName}
                    accessCode={searchParams.accessCode}
                    onOpenSettings={game.isFinished ? undefined : () => setShowSettings(true)}
                />

                {game.isFinished && (
                    <WinnerCard winner={game.winner} players={game.players}/>
                )}

                <GameStats
                    currentRound={game.currentRound}
                    winCondition={game.winCondition}
                    dealerName={currentDealer?.name}
                />

                {isOwner && (
                    <AdminPanel
                        isAdminMode={isAdminMode}
                        onToggleAdminMode={handleToggleAdminMode}
                        players={game.players}
                        onAddPlayer={handleAddPlayer}
                        onRemovePlayer={handleRemovePlayer}
                        onSubmitScoreForPlayer={handleSubmitScoreForPlayer}
                        currentRound={game.currentRound}
                        isFinished={game.isFinished}
                    />
                )}

                {/* Once you've submitted, the status moves into the bottom bar next to the waiting message */}
                {!game.isFinished && !hasCurrentUserSubmitted && (
                    <RoundStatus
                        submittedCount={submittedCount}
                        totalPlayers={activePlayerCount}
                        allPlayersSubmitted={allPlayersSubmitted}
                        hasCurrentUserSubmitted={hasCurrentUserSubmitted}
                    />
                )}

                {showReorderMode && (
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface border border-accent/40">
                        <Text size="sm" className="flex-1 text-fg">
                            Use the arrows to change the turn order. The first player deals next.
                        </Text>
                        <button type="button" onClick={() => setShowReorderMode(false)}
                                className="min-h-11 px-4 rounded-xl bg-accent text-accent-ink font-bold">
                            Done
                        </button>
                    </div>
                )}

                <ol className="flex flex-col gap-2">
                    {game.players.map((player: Player, index: number) => (
                        <li key={player.userId}>
                            <PlayerCard
                                player={player}
                                index={index}
                                playerCount={game.players.length}
                                isCurrentUser={player.userId === currentUser.id}
                                isDealer={player.userId === game.currentDealer}
                                isOwner={player.userId === game.ownerId}
                                isFinished={game.isFinished}
                                showReorderMode={showReorderMode}
                                onMove={(from, to) => void handleMovePlayer(from, to)}
                                onClick={() => setHistoryPlayerId(player.userId)}
                            />
                        </li>
                    ))}
                </ol>

                {!showReorderMode && (
                    <Text size="sm" className="text-center text-fg-muted">
                        Tap a player to see their rounds
                    </Text>
                )}

                {game.players.length > 0 && (
                    <PlayerPointsChart players={game.players} currentRound={game.currentRound}/>
                )}

                {searchParams.accessCode && (
                    <PrivateLobbyInfo
                        accessCode={searchParams.accessCode}
                        lobbyName={searchParams.lobbyName || "Private Game"}
                    />
                )}

                <Button colorscheme="subtle" variant="outline" size="md"
                        onClick={() => isLastLobbyPlayer ? setConfirmLeave(true) : void handleLeaveLobby()}
                        disabled={leaveLobbyMutation.isPending}
                        className="min-h-12 w-full">
                    Quit Game
                </Button>
            </div>

            {/* Bottom action bar: the round's main action, within thumb reach */}
            {(canSubmit || showNextRound || (hasCurrentUserSubmitted && !game.isFinished)) && (
                <div className="fixed inset-x-0 bottom-0 z-40 bg-ground-deep/95 backdrop-blur-md border-t border-line">
                    <div className="max-w-2xl mx-auto px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                        {canSubmit ? (
                            <ScoreInput
                                tempScore={scoreInput}
                                scoreError={scoreError}
                                isPending={submitScoreMutation.isPending}
                                roundNumber={game.currentRound}
                                onScoreInput={handleScoreInput}
                                onCalculatorOpen={() => setCalculatorOpen(true)}
                                onSubmit={() => handleSubmitScore()}
                            />
                        ) : showNextRound ? (
                            <button type="button" onClick={handleNextRound}
                                    disabled={nextRoundMutation.isPending}
                                    className="w-full min-h-[52px] rounded-[14px] bg-accent text-accent-ink text-lg font-extrabold disabled:opacity-50">
                                Next Round
                            </button>
                        ) : (
                            <>
                                <RoundStatus
                                    submittedCount={submittedCount}
                                    totalPlayers={activePlayerCount}
                                    allPlayersSubmitted={allPlayersSubmitted}
                                    hasCurrentUserSubmitted={hasCurrentUserSubmitted}
                                    className="justify-center"
                                />
                                <p className="flex items-center justify-center gap-2 min-h-11 text-good font-bold">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="M5 13l4 4L19 7"/>
                                    </svg>
                                    You submitted {currentUserPlayer?.currentRoundScore}. Waiting for the others…
                                </p>
                            </>
                        )}
                    </div>
                </div>
            )}

            <Sheet isOpen={showSettings && !game.isFinished} onClose={() => setShowSettings(false)} title="Game settings">
                <div className="flex flex-col gap-2">
                    <label className={`${settingRow} cursor-pointer`}>
                        <span>Auto-advance rounds</span>
                        <input
                            type="checkbox"
                            checked={autoAdvance}
                            onChange={(e) => setAutoAdvance(e.target.checked)}
                            className="w-5 h-5 accent-[#cdb27a] cursor-pointer"
                        />
                    </label>

                    {!editingWinCondition ? (
                        <button type="button" onClick={handleWinConditionEdit} disabled={allPlayersSubmitted} className={settingRow}>
                            <span>Win condition</span>
                            <span className="text-accent font-extrabold tabular-nums">{game.winCondition || 1000}</span>
                        </button>
                    ) : (
                        <div className="p-3 rounded-xl bg-surface-2 space-y-2">
                            <label htmlFor="win-condition" className="block text-fg text-sm font-semibold">Win condition</label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="win-condition"
                                    type="number"
                                    inputMode="numeric"
                                    value={tempWinCondition}
                                    onChange={(e) => setTempWinCondition(e.target.value)}
                                    placeholder="1000"
                                    min="100"
                                    max="10000"
                                    step="50"
                                    className="flex-1 min-w-0 h-12 text-center font-extrabold"
                                />
                                <Button size="md" colorscheme="subtle" variant="outline" className="h-12"
                                        onClick={handleWinConditionCancel}>Cancel</Button>
                                <Button size="md" colorscheme="accent" variant="solid" className="h-12"
                                        onClick={handleWinConditionSubmit}
                                        disabled={submitWinConditionMutation.isPending}>Save</Button>
                            </div>
                        </div>
                    )}

                    <button type="button" className={settingRow} onClick={() => {
                        setShowReorderMode(!showReorderMode);
                        setShowSettings(false);
                    }}>
                        <span>{showReorderMode ? "Stop reordering" : "Reorder players"}</span>
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
                        </svg>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            void handleResetRound();
                            setShowSettings(false);
                        }}
                        disabled={submitWinConditionMutation.isPending || resetRoundMutation.isPending}
                        className={`${settingRow} bg-bad-soft hover:bg-bad/15 border border-bad/30 text-bad`}
                    >
                        <span>Reset round</span>
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                        </svg>
                    </button>
                </div>
            </Sheet>

            {currentUserPlayer && (
                <ScoreCalculator
                    isOpen={calculatorOpen}
                    onClose={() => setCalculatorOpen(false)}
                    onSubmit={(score) => {
                        void handleSubmitScore(score);
                    }}
                    playerName={currentUserPlayer.name || "Player"}
                />
            )}

            <PlayerHistoryModal
                isOpen={!!historyPlayer}
                onClose={() => setHistoryPlayerId(null)}
                player={historyPlayer}
                currentUserId={currentUser.id}
                gameId={gameId}
                canEditOthers={canEditOthersHistory(historyPlayer, {isOwner, isAdminMode})}
                onUpdateScore={handleUpdateHistoryScore}
            />

            <DeleteConfirmationModal
                isOpen={!!playerToRemove}
                title="Remove player?"
                message="Are you sure you want to remove"
                itemName={playerToRemove?.name}
                onConfirm={() => void confirmRemovePlayer()}
                onCancel={() => setPlayerToRemove(null)}
                isDeleting={removePlayerMutation.isPending}
            />

            <DeleteConfirmationModal
                isOpen={confirmLeave}
                title="You're the last player"
                message={hasScores
                    ? "Nobody else can continue this game. It ends and stays in your game history. Leave"
                    : "Nothing has been scored yet, so this lobby will be deleted. Leave"}
                itemName={searchParams.lobbyName || "this game"}
                onConfirm={() => void handleLeaveLobby()}
                onCancel={() => setConfirmLeave(false)}
                isDeleting={leaveLobbyMutation.isPending}
                confirmLabel="Leave"
                confirmingLabel="Leaving..."
            />
        </MainLayout>
    );
}
