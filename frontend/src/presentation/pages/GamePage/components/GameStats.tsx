import React from "react";
import {formatDuration} from "@/core/duration";

interface GameStatsProps {
    currentRound: number;
    winCondition: number;
    dealerName?: string;
    // How long the game has been running (or ran, once finished)
    elapsedMs?: number | null;
}

const Tile: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({label, children, className = ""}) => (
    <div className="px-3 py-2.5 rounded-[14px] bg-surface border border-line min-w-0">
        <div className="text-xs text-fg-muted">{label}</div>
        <div className={`text-[21px] font-bold tracking-tight truncate tabular-nums ${className}`}>{children}</div>
    </div>
);

export const GameStats: React.FC<GameStatsProps> = ({currentRound, winCondition, dealerName, elapsedMs}) => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-fg">
        <Tile label="Round">{currentRound}</Tile>
        <Tile label="Goal" className="text-accent">{winCondition || 1000}</Tile>
        <Tile label="Dealer">{dealerName || "N/A"}</Tile>
        <Tile label="Time">{elapsedMs == null ? "–" : formatDuration(elapsedMs)}</Tile>
    </div>
);
