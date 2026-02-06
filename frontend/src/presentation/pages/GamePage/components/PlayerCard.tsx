// src/presentation/pages/GamePage/components/PlayerCard.tsx
import React from "react";
import {Text} from "@/presentation/components/Text";
import type {Player} from "@/types";
import { motion, AnimatePresence } from "framer-motion";

interface ScoreDisplayProps {
    total: number;
    last: number | null;
    hasSubmitted: boolean;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ total, last, hasSubmitted }) => {
    return (
        <div className="flex flex-col items-end justify-center min-w-[90px]">
            {/* TOTAL SCORE */}
            <AnimatePresence mode="popLayout">
                <motion.div
                    key={total}
                    initial={{ y: -6, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 6, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="text-gray-300 text-lg leading-tight"
                >
                    <span className="mr-1 text-sm text-gray-400">Total</span>
                    <span className="text-white font-bold text-xl">
                        {total}
                    </span>
                </motion.div>
            </AnimatePresence>

            {/* LAST ROUND SCORE */}
            {last !== null && !hasSubmitted && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className={`font-semibold text-md leading-tight ${
                        last > 0
                            ? "text-green-400"
                            : last < 0
                                ? "text-red-400"
                                : "text-gray-300"
                    }`}
                >
                    {last > 0 ? "▲" : "▼"}
                    {last}
                </motion.div>
            )}
        </div>
    );
};

interface PlayerCardProps {
    player: Player;
    index: number;
    isCurrentUser: boolean;
    isDealer: boolean;
    isFinished: boolean;
    showReorderMode: boolean;
    onDragStart: (e: React.DragEvent, index: number) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, index: number) => void;
    onClick: () => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
                                                          player,
                                                          index,
                                                          isCurrentUser,
                                                          isDealer,
                                                          showReorderMode,
                                                          onDragStart,
                                                          onDragOver,
                                                          onDrop,
                                                          onClick,
                                                      }) => {
    // Get last round score (most recent score from history)
    const lastRoundScore = player.pointsHistory && player.pointsHistory.length > 0
        ? player.pointsHistory[player.pointsHistory.length - 1]
        : null;

    return (
        <div
            draggable={showReorderMode}
            onDragStart={(e) => onDragStart(e, index)}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, index)}
            onClick={() => !showReorderMode && onClick()}
            className={`group relative overflow-hidden rounded-2xl backdrop-blur-xl border p-4 shadow-lg transition-all duration-300 ${
                player.hasSubmitted
                    ? 'bg-green-500/10 border-green-500/30 shadow-green-500/25'
                    : isCurrentUser
                        ? 'bg-purple-500/10 border-purple-500/30 hover:shadow-purple-500/25 ring-1 ring-purple-300/50'
                        : 'bg-white/10 border-white/20 hover:shadow-purple-500/25'
            } ${isDealer ? 'ring-2 ring-yellow-400 bg-yellow-500/5' : ''} ${showReorderMode ? 'cursor-move hover:scale-102' : 'cursor-pointer hover:scale-102'}`}
        >
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex w-full items-center justify-between">
                    {/* LEFT SIDE */}
                    <div className="flex items-center gap-2">
                        <div
                            className={`flex items-center justify-center w-12 h-12 rounded-full border font-bold text-lg text-white ${
                                isCurrentUser
                                    ? "bg-purple-500/30 border-purple-200/70"
                                    : "bg-gray-500/20 border-gray-300/30"
                            }`}
                        >
                            {isCurrentUser ? "👤" : index + 1}
                        </div>

                        <div className="flex flex-col">
                            <Text size="lg" weight="semibold" className="text-white flex items-center gap-2">
                                {player.name}
                                {isCurrentUser && <span className="text-purple-400 text-sm">(You)</span>}
                                {isDealer && <span className="text-yellow-400">🃏</span>}
                                {showReorderMode && <span className="text-gray-400 text-sm">🔗</span>}
                            </Text>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <ScoreDisplay
                            total={player.totalScore}
                            last={lastRoundScore}
                            hasSubmitted={player.hasSubmitted}
                        />
                    </div>
                </div>

                {!showReorderMode && player.hasSubmitted && (
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <Text size="xl" weight="bold" className="text-green-300">{player.currentRoundScore}</Text>
                            <Text size="sm" className="text-green-400">{isCurrentUser ? ' points' : ' submitted'}</Text>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};