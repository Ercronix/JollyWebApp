import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useLobbyHistory, useGameState, useDeleteLobby } from "@/core/api/hooks";
import { DeleteConfirmationModal } from "@/presentation/components/DeleteConfirmationModal";
import { UserModel } from "@/core/models/UserModel";
import { useToast } from "@/presentation/components/Toast/useToast";
import { logger } from "@/utils/logger";
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
                        className="absolute -left-2 top-0 min-w-11 h-11 flex items-center justify-center gap-2 text-on-felt hover:text-gold transition-colors focus:outline-none focus:ring-2 focus:ring-gold rounded-xl px-2"
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
                    <h1 className="font-display text-[28px] sm:text-3xl leading-[2.75rem] font-extrabold text-on-felt text-center px-12">
                        Game History
                    </h1>
                    <p className="text-on-felt-muted text-center mt-2 text-sm">
                        {lobbies.length} {lobbies.length === 1 ? 'game' : 'games'} played
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="mt-4 max-w-2xl mx-auto">
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent mb-4"></div>
                        <p className="text-on-felt-muted">Loading your games...</p>
                    </div>
                ) : lobbies.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">🎮</div>
                        <p className="font-display font-extrabold text-on-felt text-lg mb-2">No games yet</p>
                        <p className="text-on-felt-muted text-sm">Start playing to see your history here!</p>
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

function LobbyCard({ lobby, onDelete }: LobbyCardProps) {
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
        <div className="bg-card text-ink rounded-2xl overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.3)] relative">
            {/* Card Header */}
            <button
                onClick={() => setIsExpanded(prev => !prev)}
                className="w-full p-4 text-left focus:outline-none focus:ring-2 focus:ring-gold focus:ring-inset transition-all"
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-display text-ink font-extrabold text-lg mb-1 truncate">
                            {lobby.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-ink-muted">
                {dateStr} • {timeStr}
              </span>
                            {winnerPlayer && (
                                <>
                                    <span className="text-ink-muted">•</span>
                                    <span className="text-win font-bold">
                    🏆 {winnerPlayer.name}
                  </span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {!isFinished && game && (
                            <span className="px-2 py-1 bg-gold-soft text-gold-ink text-xs font-bold rounded-full">
                In Progress
              </span>
                        )}
                        <svg
                            className={`w-5 h-5 text-ink-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
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
                <div className="border-t border-dashed border-card-line p-4 space-y-4">
                    {isLoading || !game ? (
                        <div className="text-center py-4">
                            <div className="inline-block h-6 w-6 animate-spin rounded-full border-3 border-solid border-felt border-r-transparent"></div>
                            <p className="text-ink-muted mt-2 text-sm">Loading game details...</p>
                        </div>
                    ) : (
                        <>
                            {/* Scoreboard */}
                            <div className="space-y-2">
                                <h4 className="text-ink-muted font-bold text-sm uppercase tracking-wide mb-3">
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
                                                    ? 'bg-gold-soft border-2 border-gold'
                                                    : 'bg-card-muted'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-card text-ink font-display font-extrabold text-sm">
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <div className="text-ink font-bold flex items-center gap-2">
                                                            {player.name}
                                                            {winnerPlayer?.userId === player.userId && (
                                                                <span className="text-lg">👑</span>
                                                            )}
                                                        </div>
                                                        {player.pointsHistory && player.pointsHistory.length > 0 && (
                                                            <button
                                                                onClick={() => setExpandedPlayer(expandedPlayer === player.userId ? null : player.userId)}
                                                                className="min-h-11 -my-2 text-xs font-semibold text-gold-ink hover:text-ink transition-colors"
                                                            >
                                                                {expandedPlayer === player.userId ? '▼ Hide' : '▶ Show'} round details
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-display text-2xl font-extrabold text-ink">
                                                        {player.totalScore}
                                                    </div>
                                                    <div className="text-xs text-ink-muted">
                                                        {player.pointsHistory?.length || 0} rounds
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Points History */}
                                            {expandedPlayer === player.userId && player.pointsHistory && player.pointsHistory.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-card-line">
                                                    <div className="flex flex-wrap gap-2">
                                                        {player.pointsHistory.map((points, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="bg-card rounded-lg px-3 py-1.5 text-center min-w-[60px]"
                                                            >
                                                                <div className="text-xs text-ink-muted font-medium">Round {idx + 1}</div>
                                                                <div className="text-ink font-bold">{points}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                            </div>

                            {/* Game Info */}
                            <div className="bg-card-muted rounded-xl p-3 space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-ink-muted">Status</span>
                                    <span className={`font-medium ${isFinished ? 'text-win' : 'text-gold-ink'}`}>
                    {isFinished ? 'Finished' : 'In Progress'}
                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-ink-muted">Started</span>
                                    <span className="text-ink">
                    {new Date(game.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                    })}
                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-ink-muted">Players</span>
                                    <span className="text-ink">{game.players.length}</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => onDelete(lobby)}
                                className="w-full min-h-11 rounded-xl bg-danger-soft hover:bg-[#f7dfe3] border border-[#e3c2c6] text-suit-red text-sm font-bold"
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