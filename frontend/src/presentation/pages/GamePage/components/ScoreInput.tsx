import React from "react";
import {Button} from "@/presentation/components/Button";
import {Input} from "@/presentation/components/input";
import {Text} from "@/presentation/components/Text";

interface ScoreInputProps {
    currentUserId: string;
    tempScore: string;
    scoreError?: string;
    isPending: boolean;
    onScoreInput: (value: string) => void;
    onCalculatorOpen: () => void;
    onSubmit: () => void;
}

export const ScoreInput: React.FC<ScoreInputProps> = ({
                                                          tempScore,
                                                          scoreError,
                                                          isPending,
                                                          onScoreInput,
                                                          onCalculatorOpen,
                                                          onSubmit,
                                                      }) => {
    return (
        <div className="flex justify-center">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                <Text className="text-center text-white font-semibold mb-4">Enter your score</Text>
                <div className="flex items-center justify-center gap-3">
                    <Button size="md" colorscheme="greenToBlue" variant="solid"
                            onClick={onCalculatorOpen}
                            className="hover:scale-110 transition-transform border-white/80 border"><svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                    >
                        <rect x="3" y="2" width="18" height="20" rx="2" stroke="currentColor" strokeWidth="2" />
                        <rect x="6" y="5" width="12" height="3" rx="1" fill="currentColor" />

                        <circle cx="7.5" cy="12" r="1.2" fill="currentColor" />
                        <circle cx="12" cy="12" r="1.2" fill="currentColor" />
                        <circle cx="16.5" cy="12" r="1.2" fill="currentColor" />

                        <circle cx="7.5" cy="16" r="1.2" fill="currentColor" />
                        <circle cx="12" cy="16" r="1.2" fill="currentColor" />
                        <circle cx="16.5" cy="16" r="1.2" fill="currentColor" />
                    </svg></Button>
                    <Input
                        type="text"
                        value={tempScore}
                        onChange={(e) => onScoreInput(e.target.value)}
                        placeholder="0"
                        className="w-16 text-center text-white text-lg bg-white/5 border focus:border-purple-400 placeholder-gray-400 h-11"
                    />
                    <Button size="md" colorscheme="greenToBlue" variant="solid"
                            onClick={onSubmit}
                            disabled={!tempScore || isPending}
                            className="border-white/80 border hover:scale-110 transition-transform disabled:opacity-50 h-11">Submit</Button>
                </div>
                {scoreError && (
                    <Text size="sm" className="text-red-400 text-center mt-2">{scoreError}</Text>
                )}
            </div>
        </div>
    );
};