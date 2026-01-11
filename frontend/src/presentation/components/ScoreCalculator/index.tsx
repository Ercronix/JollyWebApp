import { useState, useEffect, useRef } from "react";
import { Button } from "@/presentation/components/Button";
import { Text } from "@/presentation/components/Text";

interface ScoreCalculatorProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (score: number) => void;
    playerName: string;
}

interface ConfettiPiece {
    id: number;
    x: number;
    y: number;
    color: string;
    rotation: number;
    velocityX: number;
    velocityY: number;
    size: number;
}

interface Particle {
    id: number;
    x: number;
    y: number;
    color: string;
    velocityX: number;
    velocityY: number;
    opacity: number;
    size: number;
}

export function ScoreCalculator({ isOpen, onClose, onSubmit}: ScoreCalculatorProps) {
    const [currentScore, setCurrentScore] = useState(0);
    const [roundWon, setRoundWon] = useState(false);
    const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
    const [particles, setParticles] = useState<Particle[]>([]);
    const animationFrameRef = useRef<number | undefined>(undefined);
    const fireworksIntervalRef = useRef<number | undefined>(undefined);

    // Reset when modal opens
    useEffect(() => {
        if (isOpen) {
            setCurrentScore(0);
            setRoundWon(false);
            setConfetti([]);
            setParticles([]);
        } else {
            // Clear everything when modal closes
            setConfetti([]);
            setParticles([]);
            stopFireworks();
        }
    }, [isOpen]);

    // Combined animation loop for confetti and fireworks
    useEffect(() => {
        if (confetti.length === 0 && particles.length === 0) return;

        const animate = () => {
            // Update confetti
            setConfetti(prev =>
                prev
                    .map(piece => ({
                        ...piece,
                        x: piece.x + piece.velocityX,
                        y: piece.y + piece.velocityY,
                        velocityY: piece.velocityY + 0.6, // gravity
                        velocityX: piece.velocityX * 0.99, // air resistance
                        rotation: piece.rotation + 8
                    }))
                    .filter(piece => piece.y < window.innerHeight + 50)
            );

            // Update firework particles
            setParticles(prev =>
                prev
                    .map(particle => ({
                        ...particle,
                        x: particle.x + particle.velocityX,
                        y: particle.y + particle.velocityY,
                        velocityY: particle.velocityY + 0.3, // gravity
                        velocityX: particle.velocityX * 0.98,
                        opacity: particle.opacity - 0.015
                    }))
                    .filter(particle => particle.opacity > 0)
            );

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animationFrameRef.current = requestAnimationFrame(animate);
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [confetti.length, particles.length]);

    // Trigger confetti and fireworks when round won is checked
    const handleRoundWonChange = (checked: boolean) => {
        setRoundWon(checked);
        if (checked) {
            triggerConfetti();
            startFireworks();
        } else {
            stopFireworks();
            setParticles([]);
        }
    };

    const triggerConfetti = () => {
        const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#FF1493', '#00CED1'];
        const newConfetti = Array.from({ length: 80 }, (_, i) => ({
            id: Date.now() + i,
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * 360,
            velocityX: (Math.random() - 0.5) * 20,
            velocityY: (Math.random() * -20) - 8,
            size: Math.random() * 8 + 4
        }));
        setConfetti(newConfetti);
    };

    const createFirework = () => {
        const colors = ['#FF1493', '#00CED1', '#FFD700', '#FF6B6B', '#4ECDC4', '#FF69B4', '#7B68EE', '#00FA9A'];
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * (window.innerHeight * 0.6) + window.innerHeight * 0.1;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const particleCount = 40;

        const newParticles: Particle[] = Array.from({ length: particleCount }, (_, i) => {
            const angle = (Math.PI * 2 * i) / particleCount;
            const velocity = Math.random() * 4 + 3;
            return {
                id: Date.now() + Math.random(),
                x,
                y,
                color,
                velocityX: Math.cos(angle) * velocity,
                velocityY: Math.sin(angle) * velocity,
                opacity: 1,
                size: Math.random() * 4 + 2
            };
        });

        setParticles(prev => [...prev, ...newParticles]);
    };

    const startFireworks = () => {
        // Initial burst
        createFirework();
        setTimeout(() => createFirework(), 200);
        setTimeout(() => createFirework(), 400);

        // Continue fireworks every 800ms
        fireworksIntervalRef.current = window.setInterval(() => {
            createFirework();
        }, 800);
    };

    const stopFireworks = () => {
        if (fireworksIntervalRef.current) {
            clearInterval(fireworksIntervalRef.current);
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopFireworks();
        };
    }, []);

    // Calculate total with round won bonus
    const totalScore = currentScore + (roundWon ? 50 : 0);

    const addPoints = (points: number) => {
        setCurrentScore(prev => prev + points);
    };

    const handleSubmit = () => {
        stopFireworks();
        setConfetti([]);
        setParticles([]);
        onSubmit(totalScore);
        onClose();
    };

    const handleReset = () => {
        setCurrentScore(0);
        setRoundWon(false);
        setConfetti([]);
        setParticles([]);
        stopFireworks();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Confetti */}
            {confetti.map(piece => (
                <div
                    key={piece.id}
                    className="fixed pointer-events-none z-[60] rounded-sm"
                    style={{
                        left: `${piece.x}px`,
                        top: `${piece.y}px`,
                        width: `${piece.size}px`,
                        height: `${piece.size}px`,
                        backgroundColor: piece.color,
                        transform: `rotate(${piece.rotation}deg)`,
                        boxShadow: `0 0 ${piece.size}px ${piece.color}40`
                    }}
                />
            ))}

            {/* Firework Particles */}
            {particles.map(particle => (
                <div
                    key={particle.id}
                    className="fixed pointer-events-none z-[60] rounded-full"
                    style={{
                        left: `${particle.x}px`,
                        top: `${particle.y}px`,
                        width: `${particle.size}px`,
                        height: `${particle.size}px`,
                        backgroundColor: particle.color,
                        opacity: particle.opacity,
                        boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`
                    }}
                />
            ))}

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
                                colorscheme="purpleToBlue"
                                variant="solid"
                                size="md"
                                className="hover:scale-110 transition-transform"
                            >
                                -5
                            </Button>
                            <Button
                                onClick={() => addPoints(-10)}
                                colorscheme="purpleToBlue"
                                variant="solid"
                                size="md"
                                className="hover:scale-110 transition-transform"
                            >
                                -10
                            </Button>
                            <Button
                                onClick={() => addPoints(-25)}
                                colorscheme="purpleToBlue"
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
                                    onChange={(e) => handleRoundWonChange(e.target.checked)}
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