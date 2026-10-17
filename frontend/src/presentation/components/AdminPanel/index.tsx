// src/presentation/pages/GamePage/components/AdminPanel.tsx
import React, { useState } from "react";
import { Button } from "@/presentation/components/Button";
import { Input } from "@/presentation/components/input";
import { Text } from "@/presentation/components/Text";
import type { Player } from "@/types";
import { isScoreInput, parseScore, toggleSign, validateScore } from "@/core/scores";
import { useToast } from "@/presentation/components/Toast/useToast";

interface AdminPanelProps {
    isAdminMode: boolean;
    onToggleAdminMode: () => void;
    players: Player[];
    onAddPlayer: (name: string) => void;
    onRemovePlayer: (userId: string) => void;
    onSubmitScoreForPlayer: (userId: string, score: number) => void;
    currentRound: number;
    isFinished: boolean;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
                                                          isAdminMode,
                                                          onToggleAdminMode,
                                                          players,
                                                          onAddPlayer,
                                                          onRemovePlayer,
                                                          onSubmitScoreForPlayer,
                                                          currentRound,
                                                          isFinished,
                                                      }) => {
    const toast = useToast();
    const [newPlayerName, setNewPlayerName] = useState("");
    const [playerScores, setPlayerScores] = useState<Record<string, string>>({});
    const [showAddPlayer, setShowAddPlayer] = useState(false);

    const handleAddPlayer = () => {
        if (newPlayerName.trim()) {
            onAddPlayer(newPlayerName.trim());
            setNewPlayerName("");
            setShowAddPlayer(false);
        }
    };

    const handleScoreInput = (userId: string, value: string) => {
        if (isScoreInput(value)) {
            setPlayerScores(prev => ({ ...prev, [userId]: value }));
        }
    };

    const handleSubmitScore = (userId: string) => {
        const score = parseScore(playerScores[userId] ?? '');
        if (Number.isNaN(score)) return;

        const error = validateScore(score);
        if (error) {
            toast.error(error);
            return;
        }

        onSubmitScoreForPlayer(userId, score);
        setPlayerScores(prev => {
            const newScores = { ...prev };
            delete newScores[userId];
            return newScores;
        });
    };

    return (
        <div className="space-y-4">
            {/* Admin Mode Toggle */}
            <div className="flex justify-center">
                <button
                    onClick={onToggleAdminMode}
                    aria-pressed={isAdminMode}
                    className={`w-full justify-center min-h-12 flex items-center gap-3 px-4 rounded-[14px] transition-colors duration-300 ${
                        isAdminMode
                            ? "bg-accent/10 border border-accent"
                            : "bg-surface border border-line hover:bg-surface-2"
                    }`}
                >
                    <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <Text className="w-auto text-fg font-semibold">
                        {isAdminMode ? "Admin Mode Active" : "Enable Admin Mode"}
                    </Text>
                </button>
            </div>

            {isAdminMode && (
                <div className="p-3.5 rounded-[18px] bg-surface border border-line space-y-4">
                    <div>
                        <Text size="xl" className="block text-lg font-extrabold text-fg">
                            Admin Controls
                        </Text>
                        <Text size="sm" className="block text-fg-muted mt-0.5">
                            Click on a player to correct their past scores.
                        </Text>
                    </div>

                    {/* Add Player Section */}
                    <div className="space-y-3">
                        <button
                            onClick={() => setShowAddPlayer(!showAddPlayer)}
                            className="w-full min-h-12 flex items-center justify-between px-4 rounded-xl border border-dashed border-white/20 hover:bg-white/5 transition-colors"
                        >
                            <Text className="text-fg font-semibold">
                                {showAddPlayer ? "Cancel" : "+ Add new player"}
                            </Text>
                        </button>

                        {showAddPlayer && (
                            <div className="p-3 rounded-xl bg-surface-2 space-y-3">
                                <Input
                                    type="text"
                                    value={newPlayerName}
                                    onChange={(e) => setNewPlayerName(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddPlayer()}
                                    placeholder="Enter player name"
                                    aria-label="Player name"
                                    className="w-full h-12"
                                />
                                <Button
                                    size="md"
                                    colorscheme="accent"
                                    variant="solid"
                                    onClick={handleAddPlayer}
                                    disabled={!newPlayerName.trim()}
                                    className="w-full"
                                >
                                    Add Player
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Score Entry for Each Player */}
                    {!isFinished && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Text size="sm" className="w-auto text-fg-muted font-bold">
                                    Round {currentRound} Scores
                                </Text>
                                </div>

                            <div className="space-y-2">
                                {players.map((player) => (
                                    <div
                                        key={player.userId}
                                        className="py-1 pl-3 pr-1 rounded-[14px] bg-surface-2 text-fg"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <Text className="text-fg font-bold flex-1">
                                                {player.name}
                                                {player.hasSubmitted && (
                                                    <span className="ml-2 text-good">
                                                        ✓ {player.currentRoundScore}
                                                    </span>
                                                )}
                                            </Text>
                                            <button
                                                onClick={() => onRemovePlayer(player.userId)}
                                                className="w-11 h-11 flex-none flex items-center justify-center rounded-xl bg-bad-soft hover:bg-bad/15 border border-bad/30 transition-colors"
                                                aria-label={`Remove ${player.name}`}
                                            >
                                                <svg className="w-4 h-4 text-bad" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>

                                        {!player.hasSubmitted && (
                                            <div className="flex items-center gap-2 pb-1.5 pt-1">
                                                <Input
                                                    type="text"
                                                    value={playerScores[player.userId] || ''}
                                                    onChange={(e) => handleScoreInput(player.userId, e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleSubmitScore(player.userId)}
                                                    placeholder="Score"
                                                    inputMode="numeric"
                                                    enterKeyHint="send"
                                                    aria-label={`Score for ${player.name}`}
                                                    className="flex-1 min-w-0 h-11 text-center"
                                                />
                                                <button
                                                    type="button"
                                                    aria-label="Toggle minus"
                                                    onClick={() => handleScoreInput(player.userId, toggleSign(playerScores[player.userId] || ''))}
                                                    className="w-11 h-11 flex-none rounded-xl border border-line-strong text-fg text-xl font-bold"
                                                >
                                                    ±
                                                </button>
                                                <Button
                                                    size="sm"
                                                    colorscheme="accent"
                                                    variant="solid"
                                                    className="h-11"
                                                    onClick={() => handleSubmitScore(player.userId)}
                                                    disabled={!playerScores[player.userId]}
                                                >
                                                    Save
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};