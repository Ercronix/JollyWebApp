import React from "react";

interface RoundStatusProps {
    submittedCount: number;
    totalPlayers: number;
    allPlayersSubmitted: boolean;
    hasCurrentUserSubmitted: boolean;
}

export const RoundStatus: React.FC<RoundStatusProps> = ({
                                                            submittedCount,
                                                            totalPlayers,
                                                            allPlayersSubmitted,
                                                            hasCurrentUserSubmitted,
                                                        }) => {
    if (submittedCount === 0) return null;

    return (
        <div className="flex items-center justify-between gap-2 min-h-11" role="status">
            <div className="flex items-center gap-2 text-sm text-slate-200">
                <span className={`w-2 h-2 rounded-full ${allPlayersSubmitted ? "bg-green-400" : "bg-orange-400 animate-pulse"}`} aria-hidden="true"/>
                <span>
                    {allPlayersSubmitted
                        ? "All players submitted"
                        : `${hasCurrentUserSubmitted ? "Submitted · waiting" : "Waiting for scores"} · ${submittedCount} of ${totalPlayers}`}
                </span>
            </div>
        </div>
    );
};
