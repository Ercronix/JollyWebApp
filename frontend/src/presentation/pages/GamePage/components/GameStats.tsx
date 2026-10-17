import React from "react";

interface GameStatsProps {
    currentRound: number;
    winCondition: number;
    dealerName?: string;
}

const Tile: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({label, children, className = ""}) => (
    <div className="px-3 py-2 rounded-[14px] bg-black/25 border border-on-felt/10 min-w-0">
        <div className="text-xs text-on-felt-muted">{label}</div>
        <div className={`font-display text-[22px] font-extrabold truncate tabular-nums ${className}`}>{children}</div>
    </div>
);

export const GameStats: React.FC<GameStatsProps> = ({currentRound, winCondition, dealerName}) => (
    <div className="grid grid-cols-3 gap-2 text-on-felt">
        <Tile label="Round">{currentRound}</Tile>
        <Tile label="Goal" className="text-gold">{winCondition || 1000}</Tile>
        <Tile label="Dealer">{dealerName || "N/A"}</Tile>
    </div>
);
