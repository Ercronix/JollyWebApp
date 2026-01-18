import React from "react";
import {Text} from "@/presentation/components/Text";

interface GameStatsProps {
    currentRound: number;
    submittedCount: number;
    totalPlayers: number;
    dealerName?: string;
    highestScore: number;
}

export const GameStats: React.FC<GameStatsProps> = ({
                                                        currentRound,
                                                        submittedCount,
                                                        totalPlayers,
                                                        dealerName,
                                                        highestScore,
                                                    }) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
                <Text size="sm" className="text-gray-400">Current Round </Text>
                <Text size="xl" weight="bold" className="text-purple-300">{currentRound}</Text>
            </div>

            <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
                <Text size="sm" className="text-gray-400">Submitted </Text>
                <Text size="xl" weight="bold" className="text-blue-300">{submittedCount}/{totalPlayers}</Text>
            </div>

            <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
                <Text size="sm" className="text-gray-400">Current Dealer </Text>
                <Text size="xl" weight="bold" className="text-yellow-300">{dealerName?.split(' ')[0] || 'N/A'}</Text>
            </div>

            <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
                <Text size="sm" className="text-gray-400">Highest Total </Text>
                <Text size="xl" weight="bold" className="text-green-300">{highestScore}</Text>
            </div>
        </div>
    );
};