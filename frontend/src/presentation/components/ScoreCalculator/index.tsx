import { useState, useEffect, useRef } from "react";
import { Fireworks } from "fireworks-js";
import { Button } from "@/presentation/components/Button";
import { Text } from "@/presentation/components/Text";

interface ScoreCalculatorProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (score: number) => void;
    playerName: string;
}

export function ScoreCalculator({
                                    isOpen,
                                    onClose,
                                    onSubmit,
                                }: ScoreCalculatorProps) {
    const [currentScore, setCurrentScore] = useState(0);
    const [roundWon, setRoundWon] = useState(false);

    // 🔥 Fireworks refs
    const fireworksContainerRef = useRef<HTMLDivElement | null>(null);
    const fireworksRef = useRef<Fireworks | null>(null);

    // Reset when modal opens
    useEffect(() => {
        if (isOpen) {
            setCurrentScore(0);
            setRoundWon(false);
        } else {
            stopFireworks();
        }
    }, [isOpen]);

    // Start / stop fireworks when roundWon changes
    useEffect(() => {
        if (!roundWon) {
            stopFireworks();
            return;
        }

        if (!fireworksContainerRef.current) return;

        fireworksRef.current = new Fireworks(
            fireworksContainerRef.current,
            {
                autoresize: true,
                opacity: 0.5,
                acceleration: 1.05,
                friction: 0.97,
                gravity: 1.5,
                particles: 70,
                traceLength: 3,
                traceSpeed: 10,
                explosion: 5,
                intensity: 30,
                flickering: 50,
                lineStyle: 'square',
                hue: {
                    min: 0,
                    max: 360
                },
                delay: {
                    min: 30,
                    max: 60
                },
                rocketsPoint: {
                    min: 20,
                    max: 80
                },
                lineWidth: {
                    explosion: {
                        min: 1,
                        max: 3
                    },
                    trace: {
                        min: 1,
                        max: 2
                    }
                },
                brightness: {
                    min: 50,
                    max: 80
                },
                decay: {
                    min: 0.015,
                    max: 0.03
                },
                mouse: {
                    click: false,
                    move: false,
                    max: 1
                }
            }
        );

        fireworksRef.current.start();

        return stopFireworks;
    }, [roundWon]);

    const stopFireworks = () => {
        if (fireworksRef.current) {
            fireworksRef.current.stop(true);
            fireworksRef.current = null;
        }
    };

    if (!isOpen) return null;

    const totalScore = currentScore + (roundWon ? 50 : 0);

    const addPoints = (points: number) => {
        setCurrentScore(prev => prev + points);
    };

    const handleSubmit = () => {
        stopFireworks();
        onSubmit(totalScore);
        onClose();
    };

    const handleReset = () => {
        setCurrentScore(0);
        setRoundWon(false);
        stopFireworks();
    };

    return (
        <>
            {/* 🔥 Fireworks overlay */}
            <div
                ref={fireworksContainerRef}
                className="fixed inset-0 pointer-events-none z-[55]"
            />

            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none overflow-y-auto">
                <div
                    className="bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-6 pointer-events-auto animate-in zoom-in-95 duration-300"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <Text size="xl" weight="bold" className="text-white">
                            Score Calculator
                        </Text>
                        <div className="w-24 h-1 bg-gradient-to-r from-purple-400 to-blue-400 mx-auto rounded-full" />
                    </div>

                    {/* Current Score */}
                    <div className="bg-white/10 rounded-2xl p-4 sm:p-6 text-center border border-white/20">
                        <Text size="3xl" weight="bold" className="text-white">
                            {totalScore}
                        </Text>
                    </div>

                    {/* Add Points */}
                    <div className="space-y-4">
                        <Text size="sm" weight="semibold" className="text-white text-center">
                            Add Points
                        </Text>

                        <div className="grid grid-cols-3 gap-3">
                            {[5, 10, 15, 25, 30, 75].map(value => (
                                <Button
                                    key={value}
                                    onClick={() => addPoints(value)}
                                    colorscheme="greenToBlue"
                                    variant="solid"
                                    size="md"
                                    className="hover:scale-110 transition-transform"
                                >
                                    +{value}
                                </Button>
                            ))}
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {[-5, -10, -25].map(value => (
                                <Button
                                    key={value}
                                    onClick={() => addPoints(value)}
                                    colorscheme="purpleToBlue"
                                    variant="solid"
                                    size="md"
                                    className="hover:scale-110 transition-transform"
                                >
                                    {value}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Round Won */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={roundWon}
                                onChange={(e) => setRoundWon(e.target.checked)}
                                className="w-5 h-5"
                            />
                            <div>
                                <Text weight="semibold" className="text-white">
                                    Round Won 🏆
                                </Text>
                                <Text size="sm" className="text-gray-400">
                                    +50 points
                                </Text>
                            </div>
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-col sm:flex-row">
                        <div className="flex gap-2">
                        <Button
                            onClick={handleReset}
                            colorscheme="cyanToBlue"
                            variant="outline"
                            size="md"
                            className="flex-1 hover:scale-105 transition-transform"
                        >
                            Reset
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
                        </div>
                        <Button
                            onClick={handleSubmit}
                            colorscheme="greenToBlue"
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
