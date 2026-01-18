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
                <Text className="text-center text-white font-semibold mb-4">Enter Your Score</Text>
                <div className="flex items-center justify-center gap-3">
                    <Button size="md" colorscheme="cyanToBlue" variant="outline"
                            onClick={onCalculatorOpen}
                            className="hover:scale-110 transition-transform">🧮</Button>
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
                            className="border-white/20 border hover:scale-110 transition-transform disabled:opacity-50 h-11">Submit</Button>
                </div>
                {scoreError && (
                    <Text size="sm" className="text-red-400 text-center mt-2">{scoreError}</Text>
                )}
            </div>
        </div>
    );
};