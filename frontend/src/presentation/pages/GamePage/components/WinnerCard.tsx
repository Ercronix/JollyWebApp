import React from "react";
import type {Player} from "@/types";
import {suitForSeat} from "@/core/suits";

interface WinnerCardProps {
    winner: string | null;
    players: Player[];
}

const Corner: React.FC<{ seat: number; symbol: string; className?: string }> = ({seat, symbol, className = ""}) => (
    <span aria-hidden="true" className={`flex flex-col items-center leading-none ${className}`}>
        <span className="text-[15px] font-extrabold">{seat}</span>
        <span className="text-sm">{symbol}</span>
    </span>
);

/**
 * The finished game's winner, next to their seat's playing card
 */
export const WinnerCard: React.FC<WinnerCardProps> = ({winner, players}) => {
    const seat = players.findIndex((p) => p.userId === winner);
    const winnerPlayer = seat >= 0 ? players[seat] : undefined;
    const suit = suitForSeat(Math.max(seat, 0));

    return (
        <div
            role="status"
            className="flex items-center gap-3.5 px-4 py-3.5 rounded-[20px] border border-accent/45 text-fg bg-[linear-gradient(180deg,rgba(205,178,122,0.10),rgba(205,178,122,0.03)),var(--color-surface)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_8px_20px_rgba(0,0,0,0.25)]"
        >
            {winnerPlayer && (
                <div className={`w-[58px] h-20 flex-none flex flex-col justify-between px-1.5 py-[5px] rounded-[10px] bg-ivory -rotate-[4deg] shadow-[0_6px_14px_rgba(0,0,0,0.4)] ${suit.isRed ? "text-ivory-red" : "text-ivory-ink"}`}>
                    <Corner seat={seat + 1} symbol={suit.symbol} className="self-start"/>
                    <Corner seat={seat + 1} symbol={suit.symbol} className="self-end rotate-180"/>
                </div>
            )}
            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <span className="text-xs font-bold text-accent">
                    Game over{winnerPlayer && " · winner"}
                </span>
                {winnerPlayer && (
                    <span className="text-xl font-extrabold tracking-tight leading-tight break-words">{winnerPlayer.name}</span>
                )}
            </div>
            {winnerPlayer && (
                <span className="text-[34px] font-extrabold tracking-tighter text-accent tabular-nums">{winnerPlayer.totalScore}</span>
            )}
        </div>
    );
};
