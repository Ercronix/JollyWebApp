// src/presentation/pages/GamePage/components/AdminPanel.tsx
import React, { useState } from "react";
import { Button } from "@/presentation/components/Button";
import { Input } from "@/presentation/components/input";
import { Text } from "@/presentation/components/Text";
import type { Player } from "@/types";

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
        // Allow negative numbers and empty string
        if (value === '' || value === '-' || /^-?\d*$/.test(value)) {
            setPlayerScores(prev => ({ ...prev, [userId]: value }));
        }
    };

    const handleSubmitScore = (userId: string) => {
        const scoreStr = playerScores[userId];
        if (!scoreStr || scoreStr === '-') return;

        const score = parseInt(scoreStr, 10);
        if (isNaN(score)) return;

        if (score % 5 !== 0) {
            alert("Score must be divisible by 5");
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
                    className={`flex items-center gap-3 px-6 py-3 rounded-xl backdrop-blur-xl border transition-all duration-300 ${
                        isAdminMode
                            ? "bg-orange-500/20 border-orange-500/50 shadow-orange-500/25"
                            : "bg-white/10 border-white/20 hover:bg-white/15"
                    }`}
                >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <Text className="text-white font-semibold">
                        {isAdminMode ? "Admin Mode Active" : "Enable Admin Mode"}
                    </Text>
                </button>
            </div>

            {isAdminMode && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-500/10 to-purple-500/10 backdrop-blur-xl border border-orange-500/30 shadow-2xl space-y-6">
                    <div className="text-center">
                        <Text size="xl" weight="bold" className="text-orange-300">
                            Admin Controls
                        </Text>
                    </div>

                    {/* Add Player Section */}
                    <div className="space-y-3">
                        <button
                            onClick={() => setShowAddPlayer(!showAddPlayer)}
                            className="w-full flex items-center justify-between p-3 rounded-lg bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 transition-all"
                        >
                            <Text className="text-green-300 font-medium">
                                {showAddPlayer ? "Cancel" : "➕ Add New Player"}
                            </Text>
                        </button>

                        {showAddPlayer && (
                            <div className="p-4 rounded-lg bg-white/5 border border-green-500/20 space-y-3">
                                <Input
                                    type="text"
                                    value={newPlayerName}
                                    onChange={(e) => setNewPlayerName(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddPlayer()}
                                    placeholder="Enter player name"
                                    className="w-full text-white bg-white/10 border-green-500/30 focus:border-green-400"
                                />
                                <Button
                                    size="md"
                                    colorscheme="greenToBlue"
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
                            <div className="flex items-center gap-2 justify-center">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
                                <Text size="sm" className="text-orange-300 font-medium">
                                    Round {currentRound} Scores
                                </Text>
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
                            </div>

                            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                                {players.map((player) => (
                                    <div
                                        key={player.userId}
                                        className={`p-3 rounded-lg border transition-all ${
                                            player.hasSubmitted
                                                ? "bg-green-500/10 border-green-500/30"
                                                : "bg-white/5 border-white/20"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-3 mb-2">
                                            <Text className="text-white font-medium flex-1">
                                                {player.name}
                                                {player.hasSubmitted && (
                                                    <span className="ml-2 text-green-400 text-sm">
                                                        ✓ {player.currentRoundScore}
                                                    </span>
                                                )}
                                            </Text>
                                            <button
                                                onClick={() => onRemovePlayer(player.userId)}
                                                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-all"
                                                title="Remove player"
                                            >
                                                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>

                                        {!player.hasSubmitted && (
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="text"
                                                    value={playerScores[player.userId] || ''}
                                                    onChange={(e) => handleScoreInput(player.userId, e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleSubmitScore(player.userId)}
                                                    placeholder="Score"
                                                    className="flex-1 text-center text-white bg-white/10 border-orange-500/30 focus:border-orange-400"
                                                />
                                                <Button
                                                    size="sm"
                                                    colorscheme="greenToBlue"
                                                    variant="solid"
                                                    onClick={() => handleSubmitScore(player.userId)}
                                                    disabled={!playerScores[player.userId]}
                                                >
                                                    ✓
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