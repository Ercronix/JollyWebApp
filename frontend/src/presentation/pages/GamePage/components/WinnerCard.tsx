import React from "react";
import type {Player} from "@/types";
import {suitForSeat} from "@/core/suits";

interface WinnerCardProps {
    winner: string | null;
    players: Player[];
}

const Corner: React.FC<{ seat: number; symbol: string; className?: string }> = ({seat, symbol, className = ""}) => (
    <span aria-hidden="true" className={`flex flex-col items-start leading-none ${className}`}>
        <span className="font-display text-lg font-extrabold">{seat}</span>
        <span className="text-lg">{symbol}</span>
    </span>
);

/**
 * The finished game's winner, drawn as a playing card on top of a small fan of cards
 */
export const WinnerCard: React.FC<WinnerCardProps> = ({winner, players}) => {
    const seat = players.findIndex((p) => p.userId === winner);
    const winnerPlayer = seat >= 0 ? players[seat] : undefined;
    const suit = suitForSeat(Math.max(seat, 0));

    return (
        <div role="status" className="relative flex justify-center pt-2.5 pb-1.5">
            <div aria-hidden="true" className="absolute left-1/2 top-[18px] w-40 h-[210px] -ml-24 rounded-2xl bg-[#e8e1cf] -rotate-[10deg] shadow-[0_8px_20px_rgba(0,0,0,0.35)]"/>
            <div aria-hidden="true" className="absolute left-1/2 top-[18px] w-40 h-[210px] -ml-16 rounded-2xl bg-[#f1ebdb] rotate-[8deg] shadow-[0_8px_20px_rgba(0,0,0,0.35)]"/>
            <div className={`relative w-[172px] h-[228px] flex flex-col px-3.5 py-3 rounded-[18px] bg-card ${suit.isRed ? "text-suit-red" : "text-ink"} shadow-[0_0_0_4px_var(--color-gold),0_16px_34px_rgba(0,0,0,0.5)]`}>
                {winnerPlayer && <Corner seat={seat + 1} symbol={suit.symbol}/>}
                <div className="flex-1 flex flex-col items-center justify-center gap-0.5 text-center text-ink">
                    <span className="text-xs font-extrabold tracking-[0.12em] uppercase text-gold-ink">
                        Game over{winnerPlayer && " · winner"}
                    </span>
                    {winnerPlayer && (
                        <>
                            <span className="font-display text-2xl font-extrabold leading-tight break-words">{winnerPlayer.name}</span>
                            <span className="font-display text-[40px] font-extrabold leading-none tracking-tight tabular-nums">{winnerPlayer.totalScore}</span>
                        </>
                    )}
                </div>
                {winnerPlayer && <Corner seat={seat + 1} symbol={suit.symbol} className="self-end rotate-180"/>}
            </div>
        </div>
    );
};
