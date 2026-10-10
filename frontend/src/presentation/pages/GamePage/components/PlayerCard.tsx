// src/presentation/pages/GamePage/components/PlayerCard.tsx
import React from "react";
import type {Player} from "@/types";
import { motion, AnimatePresence } from "framer-motion";

const Badge: React.FC<{ className: string; children: React.ReactNode }> = ({className, children}) => (
    <span className={`text-[11px] font-semibold px-2 py-px rounded-full ${className}`}>{children}</span>
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
        className="w-11 h-11 flex-none rounded-xl bg-white/10 hover:bg-white/15 flex items-center justify-center disabled:opacity-30"
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

    const tone = player.hasSubmitted
        ? "bg-green-500/10 border-green-400/40"
        : isCurrentUser
            ? "bg-violet-500/15 border-violet-400/55"
            : isDealer
                ? "bg-yellow-400/[0.08] border-yellow-400/45"
                : "bg-white/[0.07] border-white/15";

    const content = (
        <>
            <div
                className={`w-10 h-10 flex-none rounded-full flex items-center justify-center font-bold ${
                    isCurrentUser ? "bg-violet-600" : "bg-white/10"
                }`}
                aria-hidden="true"
            >
                {isCurrentUser ? player.name.charAt(0).toUpperCase() : index + 1}
            </div>

            <div className="flex-1 min-w-0">
                <div className="text-base font-semibold truncate">{player.name}</div>
                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    {isCurrentUser && <Badge className="bg-violet-400/25 text-violet-100">You</Badge>}
                    {isDealer && <Badge className="bg-yellow-400/20 text-yellow-200">Dealer</Badge>}
                    {isOwner && <Badge className="bg-orange-400/20 text-orange-200">Admin</Badge>}
                    {player.isTemporary && <Badge className="bg-white/10 text-slate-300">Guest</Badge>}
                    {!showReorderMode && player.hasSubmitted && (
                        <span className="flex items-center gap-1 text-xs text-green-300">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M5 13l4 4L19 7"/>
                            </svg>
                            Submitted {player.currentRoundScore > 0 ? "+" : ""}{player.currentRoundScore}
                        </span>
                    )}
                </div>
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
                            className="text-xl font-bold leading-tight tabular-nums"
                        >
                            {player.totalScore}
                        </motion.div>
                    </AnimatePresence>
                    {lastRoundScore !== null && !player.hasSubmitted ? (
                        <div className={`text-xs tabular-nums ${
                            lastRoundScore > 0 ? "text-green-300" : lastRoundScore < 0 ? "text-red-300" : "text-slate-400"
                        }`}>
                            {lastRoundScore > 0 ? "+" : ""}{lastRoundScore} last
                        </div>
                    ) : (
                        <div className="text-xs text-slate-400">total</div>
                    )}
                </div>
            )}
        </>
    );

    const className = `w-full flex items-center gap-3 p-3 rounded-2xl border text-left text-white transition-colors ${tone}`;

    if (showReorderMode) {
        return <div className={className}>{content}</div>;
    }

    return (
        <button type="button" onClick={onClick} className={`${className} hover:bg-white/[0.12] active:bg-white/[0.12]`}>
            {content}
        </button>
    );
};
