import { useState, useEffect, useRef, useCallback } from "react";
import { Fireworks } from "fireworks-js";
import { Button } from "@/presentation/components/Button";
import { Text } from "@/presentation/components/Text";
import { Sheet } from "@/presentation/components/Sheet";

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

    // Reset when modal opens (adjusting state during render, not in an effect)
    const [wasOpen, setWasOpen] = useState(isOpen);
    if (isOpen !== wasOpen) {
        setWasOpen(isOpen);
        if (isOpen) {
            setCurrentScore(0);
            setRoundWon(false);
        }
    }

    const stopFireworks = useCallback(() => {
        if (fireworksRef.current) {
            fireworksRef.current.stop(true);
            fireworksRef.current = null;
        }
    }, []);

    // Run fireworks while the modal is open and the round is won
    useEffect(() => {
        if (!isOpen || !roundWon) {
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
    }, [isOpen, roundWon, stopFireworks]);

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

            <Sheet
                isOpen={isOpen}
                onClose={onClose}
                title="Score calculator"
                footer={
                    <div className="flex gap-2">
                        <Button onClick={handleReset} colorscheme="subtle" variant="outline" size="md" className="min-h-12">
                            Reset
                        </Button>
                        <Button onClick={onClose} colorscheme="subtle" variant="outline" size="md" className="min-h-12">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            colorscheme="accent"
                            variant="solid"
                            size="md"
                            className="flex-1 min-h-12"
                            disabled={totalScore % 5 !== 0}
                        >
                            Submit {totalScore}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    {/* Current Score */}
                    <div className="bg-ground rounded-2xl p-4 text-center border border-line-strong" aria-live="polite">
                        <Text size="3xl" className="font-extrabold text-fg tabular-nums">
                            {totalScore}
                        </Text>
                    </div>

                    {/* Add Points */}
                    <div className="space-y-2">
                        <Text size="sm" weight="semibold" className="text-fg-muted text-center">
                            Add Points
                        </Text>

                        <div className="grid grid-cols-3 gap-2">
                            {[5, 10, 15, 25, 30, 75].map(value => (
                                <Button
                                    key={value}
                                    onClick={() => addPoints(value)}
                                    colorscheme="subtle"
                                    variant="solid"
                                    size="md"
                                    className="min-h-12 text-lg"
                                >
                                    +{value}
                                </Button>
                            ))}
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {[-5, -10, -25].map(value => (
                                <Button
                                    key={value}
                                    onClick={() => addPoints(value)}
                                    colorscheme="danger"
                                    variant="outline"
                                    size="md"
                                    className="min-h-12 text-lg"
                                >
                                    {value}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Round Won */}
                    <label className="flex items-center gap-3 min-h-14 px-4 rounded-xl bg-surface-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={roundWon}
                            onChange={(e) => setRoundWon(e.target.checked)}
                            className="w-5 h-5 accent-[#cdb27a]"
                        />
                        <span className="flex-1 text-fg font-semibold">Round won</span>
                        <span className="text-sm text-fg-muted">+50 points</span>
                    </label>
                </div>
            </Sheet>
        </>
    );
}
