// src/presentation/components/PlayerHistoryModal.tsx
import {Button} from "@/presentation/components/Button";
import {Text} from "@/presentation/components/Text";
import type {Player} from "@/types";

type PlayerHistoryModalProps = {
    isOpen: boolean;
    onClose: () => void;
    player: Player | null;
};

export function PlayerHistoryModal({isOpen, onClose, player}: PlayerHistoryModalProps) {
    if (!isOpen || !player) return null;

    const pointsHistory = player.pointsHistory || [];
    const hasHistory = pointsHistory.length > 0;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div
                className="relative w-full max-w-md bg-gradient-to-br from-purple-900/95 via-pink-900/95 to-blue-900/95 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10 gap-2">
                    <Text size="xl" weight="bold" className="text-white text-center">
                        📊 {player.name}'s History
                    </Text>
                    <div>
                        <Text size="xl" className="text-gray-300 text-right mt-2">
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
                            {pointsHistory.map((points, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all duration-300"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-full bg-purple-500/30 border border-purple-400/50 flex items-center justify-center">
                                            <span className="text-white font-bold text-sm leading-none flex items-center justify-center">
                                                {index + 1}
                                            </span>
                                        </div>
                                        <Text className="text-gray-300">
                                            Round {index + 1}
                                        </Text>
                                    </div>
                                    <Text
                                        size="lg"
                                        weight="bold"
                                        className={points >= 0 ? "text-green-300" : "text-red-300"}
                                    >
                                        {points >= 0 ? "+" : ""}{points}
                                    </Text>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Summary Stats */}
                    {hasHistory && (
                        <div
                            className="mt-6 p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-white/10">
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