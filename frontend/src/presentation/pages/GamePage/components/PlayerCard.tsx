// src/presentation/pages/GamePage/components/PlayerCard.tsx
import React from "react";
import type {Player} from "@/types";
import {suitForSeat} from "@/core/suits";
import { motion, AnimatePresence } from "framer-motion";

const Badge: React.FC<{ className: string; children: React.ReactNode }> = ({className, children}) => (
    <span className={`text-[11px] font-extrabold px-2 py-px rounded-full ${className}`}>{children}</span>
);

interface PlayerCardProps {
    player: Player;
    index: number;
    playerCount: number;
    isCurrentUser: boolean;
    isDealer: boolean;
    isOwner?: boolean;
    isFinished: boolean;
    showReorderMode: boolean;
    onMove: (fromIndex: number, toIndex: number) => void;
    onClick: () => void;
}

const ArrowButton: React.FC<{ label: string; disabled: boolean; onClick: () => void; d: string }> = ({label, disabled, onClick, d}) => (
    <button
        type="button"
        aria-label={label}
        disabled={disabled}
        onClick={onClick}
        className="w-11 h-11 flex-none rounded-xl bg-card-muted hover:bg-card-line/60 text-ink flex items-center justify-center disabled:opacity-30"
    >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={d}/>
        </svg>
    </button>
);

export const PlayerCard: React.FC<PlayerCardProps> = ({
                                                          player,
                                                          index,
                                                          playerCount,
                                                          isCurrentUser,
                                                          isDealer,
                                                          isOwner = false,
                                                          showReorderMode,
                                                          onMove,
                                                          onClick,
                                                      }) => {
    // Get last round score (most recent score from history)
    const lastRoundScore = player.pointsHistory && player.pointsHistory.length > 0
        ? player.pointsHistory[player.pointsHistory.length - 1]
        : null;

    const suit = suitForSeat(index);

    const content = (
        <>
            {/* Card corner: seat number over the seat's suit */}
            <div aria-hidden="true" className={`w-7 flex-none flex flex-col items-center leading-none ${suit.isRed ? "text-suit-red" : "text-ink"}`}>
                <span className="font-display text-[17px] font-extrabold">{index + 1}</span>
                <span className="text-lg">{suit.symbol}</span>
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-base font-bold truncate">{player.name}</span>
                    {isCurrentUser && <Badge className="bg-gold-soft text-gold-ink">You</Badge>}
                    {isOwner && <Badge className="bg-card-muted text-ink">Admin</Badge>}
                    {player.isTemporary && <Badge className="border border-ink-muted text-ink">Guest</Badge>}
                </div>
                {!showReorderMode && player.hasSubmitted && (
                    <div className="flex items-center gap-1 mt-0.5 text-[13px] font-bold text-win">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M5 13l4 4L19 7"/>
                        </svg>
                        Submitted {player.currentRoundScore > 0 ? "+" : ""}{player.currentRoundScore}
                    </div>
                )}
            </div>

            {showReorderMode ? (
                <div className="flex gap-2">
                    <ArrowButton label={`Move ${player.name} up`} disabled={index === 0}
                                 onClick={() => onMove(index, index - 1)} d="M18 15l-6-6-6 6"/>
                    <ArrowButton label={`Move ${player.name} down`} disabled={index === playerCount - 1}
                                 onClick={() => onMove(index, index + 1)} d="M6 9l6 6 6-6"/>
                </div>
            ) : (
                <div className="flex flex-col items-end min-w-[64px]">
                    <AnimatePresence mode="popLayout">
                        <motion.div
                            key={player.totalScore}
                            initial={{y: -6, opacity: 0}}
                            animate={{y: 0, opacity: 1}}
                            exit={{y: 6, opacity: 0}}
                            transition={{duration: 0.25}}
                            className="font-display text-[26px] font-extrabold leading-none tabular-nums"
                        >
                            {player.totalScore}
                        </motion.div>
                    </AnimatePresence>
                    {lastRoundScore !== null && !player.hasSubmitted ? (
                        <div className={`text-xs font-bold tabular-nums ${
                            lastRoundScore > 0 ? "text-win" : lastRoundScore < 0 ? "text-suit-red" : "text-ink-muted"
                        }`}>
                            {lastRoundScore > 0 ? "+" : ""}{lastRoundScore} last
                        </div>
                    ) : (
                        <div className="text-xs text-ink-muted">total</div>
                    )}
                </div>
            )}

            {isDealer && (
                <span
                    role="img"
                    aria-label="Dealer"
                    className="absolute -top-2 -right-1.5 w-[30px] h-[30px] rounded-full bg-gold text-ink border-[3px] border-dashed border-card font-display text-[13px] font-extrabold flex items-center justify-center shadow-md"
                >
                    D
                </span>
            )}
        </>
    );

    // The current player's card is outlined in gold
    const ring = isCurrentUser
        ? "shadow-[0_0_0_3px_var(--color-gold),0_6px_16px_rgba(0,0,0,0.4)]"
        : "shadow-[0_4px_12px_rgba(0,0,0,0.3)]";
    const className = `relative w-full flex items-center gap-3 py-2.5 pl-3 pr-3.5 rounded-[14px] bg-card text-ink text-left transition-transform ${ring}`;

    if (showReorderMode) {
        return <div className={className}>{content}</div>;
    }

    return (
        <button type="button" onClick={onClick} className={`${className} active:scale-[0.99]`}>
            {content}
        </button>
    );
};
