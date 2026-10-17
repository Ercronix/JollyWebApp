import React from "react";

interface GameStatsProps {
    currentRound: number;
    winCondition: number;
    dealerName?: string;
}

const Tile: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({label, children, className = ""}) => (
    <div className="px-3 py-2.5 rounded-[14px] bg-surface border border-line min-w-0">
        <div className="text-xs text-fg-muted">{label}</div>
        <div className={`text-[21px] font-bold tracking-tight truncate tabular-nums ${className}`}>{children}</div>
    </div>
);

export const GameStats: React.FC<GameStatsProps> = ({currentRound, winCondition, dealerName}) => (
    <div className="grid grid-cols-3 gap-2 text-fg">
        <Tile label="Round">{currentRound}</Tile>
        <Tile label="Goal" className="text-accent">{winCondition || 1000}</Tile>
        <Tile label="Dealer">{dealerName || "N/A"}</Tile>
    </div>
);
