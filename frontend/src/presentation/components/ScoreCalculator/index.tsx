import { useState, useEffect } from "react";
import { Button } from "@/presentation/components/Button";
import { Text } from "@/presentation/components/Text";

interface ScoreCalculatorProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (score: number) => void;
    playerName: string;
}

export function ScoreCalculator({ isOpen, onClose, onSubmit}: ScoreCalculatorProps) {
    const [currentScore, setCurrentScore] = useState(0);
    const [roundWon, setRoundWon] = useState(false);

    // Reset when modal opens
    useEffect(() => {
        if (isOpen) {
            setCurrentScore(0);
            setRoundWon(false);
        }
    }, [isOpen]);

    // Calculate total with round won bonus
    const totalScore = currentScore + (roundWon ? 50 : 0);

    const addPoints = (points: number) => {
        setCurrentScore(prev => prev + points);
    };

    const handleSubmit = () => {
        onSubmit(totalScore);
        onClose();
    };

    const handleReset = () => {
        setCurrentScore(0);
        setRoundWon(false);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none overflow-y-auto">
                <div
                    className="bg-gradient-to-br from-purple-900/95 via-pink-900/95 to-blue-900/95 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-6 pointer-events-auto animate-in zoom-in-95 duration-300"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <Text size="xl" weight="bold" className="text-white">
                            Score Calculator
                        </Text>
                        <div className="w-24 h-1 bg-gradient-to-r from-purple-400 to-blue-400 mx-auto rounded-full"></div>
                    </div>

                    {/* Current Score Display */}
                    <div className="bg-white/10 rounded-2xl p-4 sm:p-6 text-center space-y-2 border border-white/20">
                        <Text size="3xl" weight="bold" className="text-white">
                            {totalScore}
                        </Text>
                    </div>

                    {/* Point Buttons */}
                    <div className="space-y-4">
                        <Text size="sm" weight="semibold" className="text-white text-center">
                            Add Points
                        </Text>

                        {/* Positive Points */}
                        <div className="grid grid-cols-3 gap-3">
                            <Button
                                onClick={() => addPoints(5)}
                                colorscheme="greenToBlue"
                                variant="solid"
                                size="md"
                                className="hover:scale-110 transition-transform"
                            >
                                +5
                            </Button>
                            <Button
                                onClick={() => addPoints(10)}
                                colorscheme="greenToBlue"
                                variant="solid"
                                size="md"
                                className="hover:scale-110 transition-transform"
                            >
                                +10
                            </Button>
                            <Button
                                onClick={() => addPoints(15)}
                                colorscheme="greenToBlue"
                                variant="solid"
                                size="md"
                                className="hover:scale-110 transition-transform"
                            >
                                +15
                            </Button>
                            <Button
                                onClick={() => addPoints(25)}
                                colorscheme="greenToBlue"
                                variant="solid"
                                size="md"
                                className="hover:scale-110 transition-transform"
                            >
                                +25
                            </Button>
                            <Button
                                onClick={() => addPoints(50)}
                                colorscheme="greenToBlue"
                                variant="solid"
                                size="md"
                                className="hover:scale-110 transition-transform"
                            >
                                +50
                            </Button>
                            <Button
                                onClick={() => addPoints(75)}
                                colorscheme="greenToBlue"
                                variant="solid"
                                size="md"
                                className="hover:scale-110 transition-transform"
                            >
                                +75
                            </Button>
                        </div>

                        {/* Negative Points */}
                        <div className="grid grid-cols-3 gap-3">
                            <Button
                                onClick={() => addPoints(-5)}
                                colorscheme="pinkToOrange"
                                variant="solid"
                                size="md"
                                className="hover:scale-110 transition-transform"
                            >
                                -5
                            </Button>
                            <Button
                                onClick={() => addPoints(-10)}
                                colorscheme="pinkToOrange"
                                variant="solid"
                                size="md"
                                className="hover:scale-110 transition-transform"
                            >
                                -10
                            </Button>
                            <Button
                                onClick={() => addPoints(-25)}
                                colorscheme="pinkToOrange"
                                variant="solid"
                                size="md"
                                className="hover:scale-110 transition-transform"
                            >
                                -25
                            </Button>
                        </div>
                    </div>

                    {/* Round Won Checkbox */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={roundWon}
                                    onChange={(e) => setRoundWon(e.target.checked)}
                                    className="sr-only"
                                />
                                <div className={`w-6 h-6 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${
                                    roundWon
                                        ? 'bg-green-500 border-green-400 scale-110'
                                        : 'bg-white/10 border-white/30 group-hover:border-white/50'
                                }`}>
                                    {roundWon && (
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1">
                                <Text weight="semibold" className="text-white group-hover:text-green-300 transition-colors">
                                    Round Won 🏆
                                </Text>
                                <Text size="sm" className="text-gray-400">
                                    +50 points
                                </Text>
                            </div>
                        </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-col sm:flex-row">
                        <Button
                            onClick={handleReset}
                            colorscheme="cyanToBlue"
                            variant="outline"
                            size="md"
                            className="flex-1 hover:scale-105 transition-transform"
                        >
                            🔄 Reset
                        </Button>
                        <Button
                            onClick={onClose}
                            colorscheme="pinkToOrange"
                            variant="outline"
                            size="md"
                            className="flex-1 hover:scale-105 transition-transform"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            colorscheme="purpleToBlue"
                            variant="solid"
                            size="md"
                            className="flex-1 hover:scale-105"
                            disabled={totalScore % 5 !== 0}
                        >
                            ✓ Submit
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}