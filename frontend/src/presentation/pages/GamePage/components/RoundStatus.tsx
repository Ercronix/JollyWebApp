import React from "react";
import {cn} from "@/utils";

interface RoundStatusProps {
    submittedCount: number;
    totalPlayers: number;
    allPlayersSubmitted: boolean;
    hasCurrentUserSubmitted: boolean;
    className?: string;
}

export const RoundStatus: React.FC<RoundStatusProps> = ({
                                                            submittedCount,
                                                            totalPlayers,
                                                            allPlayersSubmitted,
                                                            hasCurrentUserSubmitted,
                                                            className = "",
                                                        }) => {
    if (submittedCount === 0) return null;

    return (
        <div className={cn("flex items-center justify-between gap-2 min-h-11", className)} role="status">
            <div className="flex items-center gap-2 text-sm text-[#e4ecdf]">
                <span className={`w-2 h-2 rounded-full ${allPlayersSubmitted ? "bg-[#9be8c0]" : "bg-gold animate-pulse"}`} aria-hidden="true"/>
                <span>
                    {allPlayersSubmitted
                        ? "All players submitted"
                        : `${hasCurrentUserSubmitted ? "Submitted · waiting" : "Waiting for scores"} · ${submittedCount} of ${totalPlayers}`}
                </span>
            </div>
        </div>
    );
};
