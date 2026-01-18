import React from "react";
import {Text} from "@/presentation/components/Text";
import type {Player} from "@/types";

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
                                                          isFinished,
                                                          showReorderMode,
                                                          onDragStart,
                                                          onDragOver,
                                                          onDrop,
                                                          onClick,
                                                      }) => {
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
                        ? 'bg-purple-500/10 border-purple-500/30 hover:shadow-purple-500/25 ring-1 ring-purple-400/50'
                        : 'bg-white/10 border-white/20 hover:shadow-purple-500/25'
            } ${isDealer ? 'ring-2 ring-yellow-400 bg-yellow-500/5' : ''} ${showReorderMode ? 'cursor-move hover:scale-102' : 'cursor-pointer hover:scale-102'}`}
        >
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full border font-bold text-lg text-white ${
                        isCurrentUser ? 'bg-purple-500/30 border-purple-300/50' : 'bg-gray-500/20 border-gray-300/30'
                    }`}>
                        {isCurrentUser ? '👤' : index + 1}
                    </div>

                    <div>
                        <Text size="lg" weight="semibold" className="text-white flex items-center gap-2">
                            {player.name}
                            {isCurrentUser && <span className="text-purple-400 text-sm">(You)</span>}
                            {isDealer && <span className="text-yellow-400">🃏</span>}
                            {player.hasSubmitted && <span className="text-green-400">✅</span>}
                            {showReorderMode && <span className="text-gray-400 text-sm">🔗</span>}
                        </Text>
                        <div className="flex items-center gap-4 text-sm">
                            <Text className="text-gray-400">
                                Total: <span className="text-white font-semibold">{player.totalScore}</span>
                            </Text>
                        </div>
                    </div>
                </div>

                {!showReorderMode && !isCurrentUser && !player.hasSubmitted && !isFinished && (
                    <div className="text-right">
                        <Text size="sm" className="text-gray-400">Waiting for player...</Text>
                    </div>
                )}

                {!showReorderMode && player.hasSubmitted && (
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <Text size="xl" weight="bold" className="text-green-300">{player.currentRoundScore}</Text>
                            <Text size="sm" className="text-green-400">{isCurrentUser ? 'points' : 'submitted'}</Text>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};