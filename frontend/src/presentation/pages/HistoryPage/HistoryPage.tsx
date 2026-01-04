import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useLobbyHistory, useGameState } from "@/core/api/hooks";
import type { Lobby } from "@/types";
import type { Player} from "@/types/game.types";

export function HistoryPage() {
    const navigate = useNavigate();
    const { data: lobbies = [], isLoading } = useLobbyHistory();

    return (
        <div>
            {/* Header */}
            <div>
                <div className="max-w-2xl mx-auto relative">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate({to: "/lobby"})}
                        className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 text-purple-200 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-lg p-2"
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
                    <h1 className="text-3xl font-bold text-white text-center">
                        Game History
                    </h1>
                    <p className="text-purple-200 text-center mt-2 text-sm">
                        {lobbies.length} {lobbies.length === 1 ? 'game' : 'games'} played
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 mt-6 max-w-2xl mx-auto">
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent mb-4"></div>
                        <p className="text-purple-200">Loading your games...</p>
                    </div>
                ) : lobbies.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">🎮</div>
                        <p className="text-purple-200 text-lg mb-2">No games yet</p>
                        <p className="text-purple-300 text-sm">Start playing to see your history here!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {lobbies.map(lobby => (
                            <LobbyCard key={lobby.id} lobby={lobby} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

interface LobbyCardProps {
    lobby: Lobby;
}

function LobbyCard({ lobby }: LobbyCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
    const { data: game, isLoading } = useGameState(isExpanded ? lobby.gameId : undefined);

    const date = new Date(lobby.createdAt);
    const isToday = date.toDateString() === new Date().toDateString();
    const dateStr = isToday ? 'Today' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    const winnerPlayer: Player | undefined = game?.winner ? game.players.find(p => p.userId === game.winner) : undefined;
    const isFinished = game?.isFinished ?? false;

    return (
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden shadow-xl transition-all hover:shadow-2xl hover:border-white/30">
            {/* Card Header */}
            <button
                onClick={() => setIsExpanded(prev => !prev)}
                className="w-full p-4 text-left focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-inset transition-all"
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-lg mb-1 truncate">
                            {lobby.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-purple-200">
                {dateStr} • {timeStr}
              </span>
                            {winnerPlayer && (
                                <>
                                    <span className="text-purple-300">•</span>
                                    <span className="text-green-400 font-medium">
                    🏆 {winnerPlayer.name}
                  </span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {!isFinished && game && (
                            <span className="px-2 py-1 bg-yellow-400/20 text-yellow-300 text-xs font-medium rounded-full">
                In Progress
              </span>
                        )}
                        <svg
                            className={`w-5 h-5 text-purple-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
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
                <div className="border-t border-white/10 p-4 space-y-4 bg-black/10">
                    {isLoading || !game ? (
                        <div className="text-center py-4">
                            <div className="inline-block h-6 w-6 animate-spin rounded-full border-3 border-solid border-purple-300 border-r-transparent"></div>
                            <p className="text-purple-200 mt-2 text-sm">Loading game details...</p>
                        </div>
                    ) : (
                        <>
                            {/* Scoreboard */}
                            <div className="space-y-2">
                                <h4 className="text-white font-semibold text-sm uppercase tracking-wide mb-3">
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
                                                    ? 'bg-gradient-to-r from-green-500/30 to-green-600/20 border-2 border-green-400/50'
                                                    : 'bg-white/5 border border-white/10'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/30 text-purple-200 font-bold text-sm">
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-medium flex items-center gap-2">
                                                            {player.name}
                                                            {winnerPlayer?.userId === player.userId && (
                                                                <span className="text-lg">👑</span>
                                                            )}
                                                        </div>
                                                        {player.pointsHistory && player.pointsHistory.length > 0 && (
                                                            <button
                                                                onClick={() => setExpandedPlayer(expandedPlayer === player.userId ? null : player.userId)}
                                                                className="text-xs text-purple-300 hover:text-purple-200 transition-colors mt-1"
                                                            >
                                                                {expandedPlayer === player.userId ? '▼ Hide' : '▶ Show'} round details
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold text-white">
                                                        {player.totalScore}
                                                    </div>
                                                    <div className="text-xs text-purple-300">
                                                        {player.pointsHistory?.length || 0} rounds
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Points History */}
                                            {expandedPlayer === player.userId && player.pointsHistory && player.pointsHistory.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-white/10">
                                                    <div className="flex flex-wrap gap-2">
                                                        {player.pointsHistory.map((points, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="bg-white/10 rounded-lg px-3 py-1.5 text-center min-w-[60px]"
                                                            >
                                                                <div className="text-xs text-purple-300 font-medium">Round {idx + 1}</div>
                                                                <div className="text-white font-bold">{points}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                            </div>

                            {/* Game Info */}
                            <div className="bg-white/5 rounded-xl p-3 space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-purple-300">Status</span>
                                    <span className={`font-medium ${isFinished ? 'text-green-400' : 'text-yellow-400'}`}>
                    {isFinished ? 'Finished' : 'In Progress'}
                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-purple-300">Started</span>
                                    <span className="text-white">
                    {new Date(game.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                    })}
                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-purple-300">Players</span>
                                    <span className="text-white">{game.players.length}</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}