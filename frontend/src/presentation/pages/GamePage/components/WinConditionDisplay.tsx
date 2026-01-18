import React from "react";
import {Text} from "@/presentation/components/Text";
import type {Player} from "@/types";

interface WinConditionDisplayProps {
    isFinished: boolean;
    winCondition: number;
    winner: string|null;
    players: Player[];
}

export const WinConditionDisplay: React.FC<WinConditionDisplayProps> = ({
                                                                            isFinished,
                                                                            winCondition,
                                                                            winner,
                                                                            players
                                                                        }) => {
    if (isFinished) {
        const winnerName = players.find((p) => p.userId === winner)?.name;
        return (
            <Text size="xl" className="text-green-300 font-bold animate-pulse text-center">
                Game Over! Winner: {winnerName}
            </Text>
        );
    }

    return (
        <div className="flex justify-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-white-500/10 to-orange-500/10 backdrop-blur-xl border border-gray-600">
                <div>
                    <Text size="sm" className="text-yellow-200/70">Win Condition: </Text>
                    <Text size="lg" weight="bold" className="text-yellow-300">
                        {winCondition || 1000}
                    </Text>
                </div>
            </div>
        </div>
    );
};