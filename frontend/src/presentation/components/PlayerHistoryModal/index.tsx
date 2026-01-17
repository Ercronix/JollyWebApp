// src/presentation/components/PlayerHistoryModal.tsx
import { useState } from "react";
import { Button } from "@/presentation/components/Button";
import { Text } from "@/presentation/components/Text";
import { Input } from "@/presentation/components/input";
import type { Player } from "@/types";

type PlayerHistoryModalProps = {
    isOpen: boolean;
    onClose: () => void;
    player: Player | null;
    currentUserId?: string;
    gameId?: string;
    onUpdateScore?: (roundIndex: number, newScore: number) => Promise<void>;
};

export function PlayerHistoryModal({
                                       isOpen,
                                       onClose,
                                       player,
                                       currentUserId,
                                       gameId,
                                       onUpdateScore
                                   }: PlayerHistoryModalProps) {
    const [editingRound, setEditingRound] = useState<number | null>(null);
    const [editValue, setEditValue] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen || !player) return null;

    const pointsHistory = player.pointsHistory || [];
    const hasHistory = pointsHistory.length > 0;
    const canEdit = currentUserId === player.userId && !!onUpdateScore && !!gameId;

    const handleEditClick = (roundIndex: number, currentScore: number) => {
        setEditingRound(roundIndex);
        setEditValue(currentScore.toString());
        setError("");
    };

    const handleCancelEdit = () => {
        setEditingRound(null);
        setEditValue("");
        setError("");
    };

    const handleSaveEdit = async (roundIndex: number) => {
        const newScore = parseInt(editValue, 10);

        if (isNaN(newScore)) {
            setError("Please enter a valid number");
            return;
        }

        if (newScore % 5 !== 0) {
            setError("Score must be divisible by 5");
            return;
        }

        if (!onUpdateScore) return;

        setIsSubmitting(true);
        try {
            await onUpdateScore(roundIndex, newScore);
            setEditingRound(null);
            setEditValue("");
            setError("");
        } catch (err) {
            setError("Failed to update score");
            console.error("Error updating score:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (value: string) => {
        if (value === "" || /^-?\d*$/.test(value)) {
            setEditValue(value);
            setError("");
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-md bg-gradient-to-br from-purple-900/50 via-blue-700/50 to-blue-900/50 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10 gap-2">
                    <Text size="xl" weight="bold" className="text-white text-center">
                        📊 {player.name}'s History
                    </Text>
                    <div className="flex justify-between items-center mt-2">
                        <Text size="xl" className="text-gray-300">
                            Total Score: {player.totalScore}
                        </Text>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-96 overflow-y-auto">
                    {!hasHistory ? (
                        <div className="text-center py-8">
                            <Text className="text-gray-400">
                                No rounds completed yet
                            </Text>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pointsHistory.map((points, index) => {
                                const isEditing = editingRound === index;

                                return (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all duration-300"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-purple-500/30 border border-purple-400/50 flex items-center justify-center">
                                                <span className="text-white font-bold text-sm leading-none flex items-center justify-center">
                                                    {index + 1}
                                                </span>
                                            </div>
                                            <Text className="text-gray-300">
                                                Round {index + 1}
                                            </Text>
                                        </div>

                                        {isEditing ? (
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="text"
                                                    value={editValue}
                                                    onChange={(e) => handleInputChange(e.target.value)}
                                                    className="w-20 text-center text-white bg-white/10 border border-white/30 focus:border-blue-400"
                                                    autoFocus
                                                />
                                                <Button
                                                    size="sm"
                                                    colorscheme="greenToBlue"
                                                    variant="solid"
                                                    onClick={() => handleSaveEdit(index)}
                                                    disabled={isSubmitting}
                                                    className="px-3 py-1 min-w-[36px]"
                                                >
                                                    ✓
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    colorscheme="pinkToOrange"
                                                    variant="outline"
                                                    onClick={handleCancelEdit}
                                                    disabled={isSubmitting}
                                                    className="px-3 py-1 min-w-[36px]"
                                                >
                                                    ✕
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <Text
                                                    size="lg"
                                                    weight="bold"
                                                    className={points >= 0 ? "text-green-300 min-w-[60px] text-right" : "text-red-300 min-w-[60px] text-right"}
                                                >
                                                    {points >= 0 ? "+" : ""}{points}
                                                </Text>
                                                {canEdit && (
                                                    <button
                                                        onClick={() => handleEditClick(index, points)}
                                                        className="px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/40 border border-blue-400/40 text-blue-300 text-sm transition-all duration-200 hover:scale-105 flex items-center gap-1.5"
                                                        title="Edit this score"
                                                    >
                                                        <span className="text-xs">Edit</span>
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {error && (
                        <div className="mt-3 p-3 rounded-lg bg-red-500/20 border border-red-500/30">
                            <Text size="sm" className="text-red-300 text-center">
                                {error}
                            </Text>
                        </div>
                    )}

                    {/* Summary Stats */}
                    {hasHistory && (
                        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-white/10">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <Text size="sm" className="text-gray-400">Rounds </Text>
                                    <Text size="lg" weight="bold" className="text-white">
                                        {pointsHistory.length}
                                    </Text>
                                </div>
                                <div>
                                    <Text size="sm" className="text-gray-400">Average </Text>
                                    <Text size="lg" weight="bold" className="text-white">
                                        {Math.round(pointsHistory.reduce((a, b) => a + b, 0) / pointsHistory.length)}
                                    </Text>
                                </div>
                                <div>
                                    <Text size="sm" className="text-gray-400">Best </Text>
                                    <Text size="lg" weight="bold" className="text-green-300">
                                        {Math.max(...pointsHistory)}
                                    </Text>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10">
                    <Button
                        colorscheme="purpleToBlue"
                        variant="solid"
                        className="w-full hover:scale-105 transition-transform duration-300"
                        onClick={onClose}
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
}