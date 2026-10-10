// src/presentation/components/PlayerHistoryModal.tsx
import { useState } from "react";
import { Button } from "@/presentation/components/Button";
import { Text } from "@/presentation/components/Text";
import { Input } from "@/presentation/components/input";
import type { Player } from "@/types";
import { isScoreInput, parseScore, toggleSign, validateScore } from "@/core/scores";
import { Sheet } from "@/presentation/components/Sheet";
import { logger } from "@/utils/logger";

type PlayerHistoryModalProps = {
    isOpen: boolean;
    onClose: () => void;
    player: Player | null;
    currentUserId?: string;
    gameId?: string;
    // Lobby admin in admin mode: may edit every player's history, not just their own
    canEditOthers?: boolean;
    onUpdateScore?: (roundIndex: number, newScore: number) => Promise<void>;
};

export function PlayerHistoryModal({
                                       isOpen,
                                       onClose,
                                       player,
                                       currentUserId,
                                       gameId,
                                       canEditOthers = false,
                                       onUpdateScore
                                   }: PlayerHistoryModalProps) {
    const [editingRound, setEditingRound] = useState<number | null>(null);
    const [editValue, setEditValue] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen || !player) return null;

    const pointsHistory = player.pointsHistory || [];
    const hasHistory = pointsHistory.length > 0;
    const canEdit = (canEditOthers || currentUserId === player.userId) && !!onUpdateScore && !!gameId;

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
        const newScore = parseScore(editValue);
        const validationError = validateScore(newScore);
        if (validationError) {
            setError(validationError);
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
            setError(err instanceof Error && err.message ? err.message : "Failed to update score");
            logger.error("Error updating score:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (value: string) => {
        if (isScoreInput(value)) {
            setEditValue(value);
            setError("");
        }
    };

    const average = hasHistory ? Math.round(pointsHistory.reduce((a, b) => a + b, 0) / pointsHistory.length) : 0;

    return (
        <Sheet
            isOpen={isOpen}
            onClose={onClose}
            title={player.name}
            subtitle={`Total ${player.totalScore} · ${pointsHistory.length} ${pointsHistory.length === 1 ? "round" : "rounds"}`}
        >
            {canEdit && canEditOthers && currentUserId !== player.userId && (
                <p className="mb-2 px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/35 text-[13px] text-orange-100">
                    Admin mode: you can correct this player's scores.
                </p>
            )}

            {!hasHistory ? (
                <Text className="text-slate-400 text-center py-8">No rounds completed yet</Text>
            ) : (
                <ol>
                    {pointsHistory.map((points, index) => {
                        const isEditing = editingRound === index;
                        const inputId = `history-round-${index}`;

                        return (
                            <li key={index} className="border-b border-white/[0.08]">
                                {isEditing ? (
                                    <div className="flex flex-col gap-2 py-3">
                                        <label htmlFor={inputId} className="text-sm text-slate-200">Round {index + 1}</label>
                                        <div className="flex gap-2">
                                            <Input
                                                id={inputId}
                                                type="text"
                                                inputMode="numeric"
                                                value={editValue}
                                                onChange={(e) => handleInputChange(e.target.value)}
                                                className="flex-1 min-w-0 h-12 text-center text-lg font-bold text-white bg-white/[0.06] border border-violet-400 focus:border-violet-300"
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                aria-label="Toggle minus"
                                                onClick={() => handleInputChange(toggleSign(editValue))}
                                                className="w-12 h-12 flex-none rounded-xl border border-white/20 bg-white/[0.06] text-xl font-bold"
                                            >
                                                ±
                                            </button>
                                            <Button size="md" colorscheme="pinkToOrange" variant="outline" className="h-12"
                                                    onClick={handleCancelEdit} disabled={isSubmitting}>
                                                Cancel
                                            </Button>
                                            <Button size="md" colorscheme="purpleToBlue" variant="solid" className="h-12"
                                                    onClick={() => handleSaveEdit(index)} disabled={isSubmitting}>
                                                Save
                                            </Button>
                                        </div>
                                        {error && <p role="alert" className="text-[13px] text-red-300">{error}</p>}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 min-h-14">
                                        <span className="w-20 text-sm text-slate-400">Round {index + 1}</span>
                                        <span className={`flex-1 text-[17px] font-bold tabular-nums ${points >= 0 ? "text-green-300" : "text-red-300"}`}>
                                            {points >= 0 ? "+" : ""}{points}
                                        </span>
                                        {canEdit && (
                                            <button
                                                type="button"
                                                onClick={() => handleEditClick(index, points)}
                                                className="min-h-11 px-4 rounded-xl border border-blue-300/40 bg-blue-500/15 hover:bg-blue-500/25 text-blue-100 text-sm font-semibold"
                                            >
                                                Edit
                                            </button>
                                        )}
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ol>
            )}

            {hasHistory && (
                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    <div className="p-2.5 rounded-xl bg-white/[0.06]">
                        <div className="text-xs text-slate-400">Rounds</div>
                        <div className="text-lg font-bold">{pointsHistory.length}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.06]">
                        <div className="text-xs text-slate-400">Average</div>
                        <div className="text-lg font-bold tabular-nums">{average}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.06]">
                        <div className="text-xs text-slate-400">Best</div>
                        <div className="text-lg font-bold text-green-300 tabular-nums">{Math.max(...pointsHistory)}</div>
                    </div>
                </div>
            )}
        </Sheet>
    );
}
