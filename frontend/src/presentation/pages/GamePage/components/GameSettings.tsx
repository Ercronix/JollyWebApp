import React from "react";
import {Button} from "@/presentation/components/Button";
import {Input} from "@/presentation/components/input";
import {Text} from "@/presentation/components/Text";

interface GameSettingsProps {
    showSettings: boolean;
    setShowSettings: (show: boolean) => void;
    autoAdvance: boolean;
    setAutoAdvance: (auto: boolean) => void;
    editingWinCondition: boolean;
    tempWinCondition: string;
    setTempWinCondition: (value: string) => void;
    allPlayersSubmitted: boolean;
    showReorderMode: boolean;
    setShowReorderMode: (show: boolean) => void;
    isPending: boolean;
    onWinConditionEdit: () => void;
    onWinConditionSubmit: () => void;
    onWinConditionCancel: () => void;
    onResetRound: () => void;
}

export const GameSettings: React.FC<GameSettingsProps> = ({
                                                              showSettings,
                                                              setShowSettings,
                                                              autoAdvance,
                                                              setAutoAdvance,
                                                              editingWinCondition,
                                                              tempWinCondition,
                                                              setTempWinCondition,
                                                              allPlayersSubmitted,
                                                              showReorderMode,
                                                              setShowReorderMode,
                                                              isPending,
                                                              onWinConditionEdit,
                                                              onWinConditionSubmit,
                                                              onWinConditionCancel,
                                                              onResetRound,
                                                          }) => {
    return (
        <div className="flex flex-col items-center gap-2">
            <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105"
            >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <Text className="text-white font-medium">Settings</Text>
                <svg className={`w-4 h-4 text-white transition-transform duration-300 ${showSettings ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            <div className={`w-full max-w-md overflow-hidden transition-all duration-500 ease-in-out ${
                showSettings ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
                <div className="p-4 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl space-y-3">
                    <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                        <Text className="text-white text-sm font-medium">Auto-advance rounds</Text>
                        <input
                            type="checkbox"
                            checked={autoAdvance}
                            onChange={(e) => setAutoAdvance(e.target.checked)}
                            className="w-4 h-4 rounded border-white/30 bg-white/5 text-purple-500 focus:ring-2 focus:ring-purple-400 cursor-pointer"
                        />
                    </label>

                    {!editingWinCondition ? (
                        <button
                            onClick={onWinConditionEdit}
                            disabled={allPlayersSubmitted}
                            className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Text className="text-white text-sm font-medium">Edit Win Condition</Text>
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                    ) : (
                        <div className="p-3 rounded-lg bg-white/5 space-y-2">
                            <Text className="text-white text-sm font-medium">Win Condition</Text>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    value={tempWinCondition}
                                    onChange={(e) => setTempWinCondition(e.target.value)}
                                    placeholder="1000"
                                    min="100"
                                    max="10000"
                                    step="50"
                                    className="flex-1 text-center text-white bg-white/10 border border-yellow-500/30 focus:border-yellow-400 placeholder-gray-400"
                                />
                                <Button size="sm" colorscheme="greenToBlue" variant="solid"
                                        onClick={onWinConditionSubmit}
                                        disabled={isPending}>✓</Button>
                                <Button size="sm" colorscheme="pinkToOrange" variant="outline"
                                        onClick={onWinConditionCancel}>✕</Button>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => setShowReorderMode(!showReorderMode)}
                        className={showReorderMode ? "w-full flex items-center justify-between p-3 rounded-lg border border-white bg-blue-500/10 hover:bg-white/10 transition-all" : "w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all\""}
                    >
                        <Text className="text-white text-sm font-medium">
                            {showReorderMode ? "Exit Reorder Mode" : "Reorder Players"}
                        </Text>
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                    </button>

                    <button
                        onClick={onResetRound}
                        disabled={isPending}
                        className="w-full flex items-center justify-between p-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-all disabled:opacity-50"
                    >
                        <Text className="text-red-300 text-sm font-medium">Reset Round</Text>
                        <svg className="w-4 h-4 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};