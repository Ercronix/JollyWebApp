import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useLobbyHistory, useGameState, useDeleteLobby } from "@/core/api/hooks";
import { DeleteConfirmationModal } from "@/presentation/components/DeleteConfirmationModal";
import { UserModel } from "@/core/models/UserModel";
import { useToast } from "@/presentation/components/Toast/useToast";
import { logger } from "@/utils/logger";
import { formatDuration } from "@/core/duration";
import type { Lobby } from "@/types";
import type { Player } from "@/types/game.types";

export function HistoryPage() {
    const navigate = useNavigate();
    const { data: lobbies = [], isLoading } = useLobbyHistory();
    const deleteLobbyMutation = useDeleteLobby();
    const [currentUser] = useState(() => UserModel.getInstance().getCurrentUser());
    const toast = useToast();
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; lobby: Lobby | null }>({
        show: false,
        lobby: null,
    });

    const handleDeleteLobby = (lobby: Lobby) => {
        setDeleteConfirmation({ show: true, lobby });
    };

    const confirmDeleteLobby = async () => {
        if (!deleteConfirmation.lobby || !currentUser) return;

        try {
            await deleteLobbyMutation.mutateAsync({ lobbyId: deleteConfirmation.lobby.id });
            setDeleteConfirmation({ show: false, lobby: null });
        } catch (error) {
            logger.error('Failed to delete lobby:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to delete lobby');
        }
    };

    const cancelDeleteLobby = () => {
        setDeleteConfirmation({ show: false, lobby: null });
    };

    return (
        <div>
            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={deleteConfirmation.show}
                title="Delete Lobby?"
                message="Are you sure you want to delete"
                itemName={deleteConfirmation.lobby?.name}
                onConfirm={confirmDeleteLobby}
                onCancel={cancelDeleteLobby}
                isDeleting={deleteLobbyMutation.isPending}
            />

            {/* Header */}
            <div>
                <div className="max-w-2xl mx-auto relative">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate({ to: "/lobby" })}
                        aria-label="Back to lobbies"
                        className="absolute -left-2 top-0 min-w-11 h-11 flex items-center justify-center gap-2 text-fg hover:text-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent rounded-xl px-2"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="hidden sm:inline font-medium">Back</span>
                    </button>

                    {/* Title */}
                    <h1 className="text-[28px] sm:text-3xl leading-[2.75rem] font-extrabold text-fg text-center px-12">
                        Game History
                    </h1>
                    <p className="text-fg-muted text-center mt-2 text-sm">
                        {lobbies.length} {lobbies.length === 1 ? 'game' : 'games'} played
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="mt-4 max-w-2xl mx-auto">
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent mb-4"></div>
                        <p className="text-fg-muted">Loading your games...</p>
                    </div>
                ) : lobbies.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">🎮</div>
                        <p className="font-extrabold text-fg text-lg mb-2">No games yet</p>
                        <p className="text-fg-muted text-sm">Start playing to see your history here!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {lobbies.map(lobby => (
                            <LobbyCard
                                key={lobby.id}
                                lobby={lobby}
                                onDelete={handleDeleteLobby}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

interface LobbyCardProps {
    lobby: Lobby;
    onDelete: (lobby: Lobby) => void;
}

export function LobbyCard({ lobby, onDelete }: LobbyCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

    // Ensure lobby has a valid ID
    const { data: game, isLoading } = useGameState(isExpanded ? lobby.gameId : undefined);

    const date = new Date(lobby.createdAt);
    const isToday = date.toDateString() === new Date().toDateString();
    const dateStr = isToday ? 'Today' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    const winnerPlayer: Player | undefined = game?.winner ? game.players.find(p => p.userId === game.winner) : undefined;
    const isFinished = game?.isFinished ?? false;

    return (
        <div className="bg-surface border border-line text-fg rounded-2xl overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_8px_20px_rgba(0,0,0,0.25)] relative">
            {/* Card Header */}
            <button
                onClick={() => setIsExpanded(prev => !prev)}
                className="w-full p-4 text-left focus:outline-none focus:ring-2 focus:ring-accent focus:ring-inset transition-all"
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-fg font-extrabold text-lg mb-1 truncate">
                            {lobby.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-fg-muted">
                {dateStr} • {timeStr}
              </span>
                            {winnerPlayer && (
                                <>
                                    <span className="text-fg-muted">•</span>
                                    <span className="text-good font-bold">
                    🏆 {winnerPlayer.name}
                  </span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {!isFinished && game && (
                            <span className="px-2 py-1 bg-accent/[0.12] text-accent text-xs font-bold rounded-full">
                In Progress
              </span>
                        )}
                        <svg
                            className={`w-5 h-5 text-fg-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </button>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="border-t border-line p-4 space-y-4">
                    {isLoading || !game ? (
                        <div className="text-center py-4">
                            <div className="inline-block h-6 w-6 animate-spin rounded-full border-3 border-solid border-accent border-r-transparent"></div>
                            <p className="text-fg-muted mt-2 text-sm">Loading game details...</p>
                        </div>
                    ) : (
                        <>
                            {/* Scoreboard */}
                            <div className="space-y-2">
                                <h4 className="text-fg-muted font-bold text-sm uppercase tracking-wide mb-3">
                                    Final Scores
                                </h4>
                                {game.players
                                    .slice()
                                    .sort((a, b) => b.totalScore - a.totalScore)
                                    .map((player, index) => (
                                        <div
                                            key={player.userId}
                                            className={`relative rounded-xl p-3 transition-all ${
                                                winnerPlayer?.userId === player.userId
                                                    ? 'bg-accent/10 border border-accent/50'
                                                    : 'bg-surface-2'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-ground text-fg font-bold text-sm">
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <div className="text-fg font-bold flex items-center gap-2">
                                                            {player.name}
                                                            {winnerPlayer?.userId === player.userId && (
                                                                <span className="text-lg">👑</span>
                                                            )}
                                                        </div>
                                                        {player.pointsHistory && player.pointsHistory.length > 0 && (
                                                            <button
                                                                onClick={() => setExpandedPlayer(expandedPlayer === player.userId ? null : player.userId)}
                                                                className="min-h-11 -my-2 text-xs font-semibold text-accent hover:text-fg transition-colors"
                                                            >
                                                                {expandedPlayer === player.userId ? '▼ Hide' : '▶ Show'} round details
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-extrabold text-fg">
                                                        {player.totalScore}
                                                    </div>
                                                    <div className="text-xs text-fg-muted">
                                                        {player.pointsHistory?.length || 0} rounds
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Points History */}
                                            {expandedPlayer === player.userId && player.pointsHistory && player.pointsHistory.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-line">
                                                    <div className="flex flex-wrap gap-2">
                                                        {player.pointsHistory.map((points, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="bg-ground rounded-lg px-3 py-1.5 text-center min-w-[60px]"
                                                            >
                                                                <div className="text-xs text-fg-muted font-medium">Round {idx + 1}</div>
                                                                <div className="text-fg font-bold">{points}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                            </div>

                            {/* Game Info */}
                            <div className="bg-surface-2 rounded-xl p-3 space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-fg-muted">Status</span>
                                    <span className={`font-medium ${isFinished ? 'text-good' : 'text-accent'}`}>
                    {isFinished ? 'Finished' : 'In Progress'}
                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-fg-muted">Started</span>
                                    <span className="text-fg">
                    {new Date(game.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                    })}
                  </span>
                                </div>
                                {game.finishedAt && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-fg-muted">Duration</span>
                                        <span className="text-fg tabular-nums">
                                            {formatDuration(new Date(game.finishedAt).getTime() - new Date(game.createdAt).getTime())}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm">
                                    <span className="text-fg-muted">Players</span>
                                    <span className="text-fg">{game.players.length}</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => onDelete(lobby)}
                                className="w-full min-h-11 rounded-xl bg-bad-soft hover:bg-bad/15 border border-bad/30 text-bad text-sm font-bold"
                            >
                                Delete from history
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}