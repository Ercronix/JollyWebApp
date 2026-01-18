import React from "react";
import {Button} from "@/presentation/components/Button";
import {Text} from "@/presentation/components/Text";

interface RoundStatusProps {
    submittedCount: number;
    totalPlayers: number;
    allPlayersSubmitted: boolean;
    hasCurrentUserSubmitted: boolean;
    autoAdvance: boolean;
    isPending: boolean;
    onNextRound: () => void;
}

export const RoundStatus: React.FC<RoundStatusProps> = ({
                                                            submittedCount,
                                                            totalPlayers,
                                                            allPlayersSubmitted,
                                                            hasCurrentUserSubmitted,
                                                            autoAdvance,
                                                            isPending,
                                                            onNextRound,
                                                        }) => {
    return (
        <div className="text-center space-y-4">
            {submittedCount > 0 && (
                <div>
                    <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20">
                        <div className={`w-3 h-3 rounded-full ${allPlayersSubmitted ? 'bg-green-400' : 'bg-orange-400'} animate-pulse`}></div>
                        <Text className="text-white font-medium">
                            {allPlayersSubmitted ? "✅ All players submitted" : `⏳ Waiting for scores (${submittedCount}/${totalPlayers})`}
                        </Text>
                    </div>
                </div>
            )}

            {hasCurrentUserSubmitted && !allPlayersSubmitted && (
                <div className="mt-2">
                    <Text size="sm" className="text-green-300">✅ You've submitted! Waiting for other players...</Text>
                </div>
            )}

            {allPlayersSubmitted && !autoAdvance && (
                <Button colorscheme="greenToBlue" variant="solid" size="md"
                        onClick={onNextRound}
                        disabled={isPending}
                        className="hover:scale-105 transition-transform duration-300 animate-pulse">
                    Next Round
                </Button>
            )}
        </div>
    );
};