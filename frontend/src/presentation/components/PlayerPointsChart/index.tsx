import { useState } from 'react';
import type { Player } from '../../../types';

const PLAYER_COLORS = [
    '#a78bfa',
    '#60a5fa',
    '#34d399',
    '#fbbf24',
    '#f87171',
    '#fb923c',
    '#ec4899',
    '#14b8a6',
];

interface PlayerPointsGraphProps {
    players: Player[];
    currentRound: number;
}

export function PlayerPointsChart({ players, currentRound }: PlayerPointsGraphProps) {
    const [hoveredPoint, setHoveredPoint] = useState<{
        playerName: string;
        round: number;
        score: number;
        x: number;
        y: number;
    } | null>(null);

    if (!players.length || currentRound === 0) return null;

    /* ---------- Dimensions ---------- */
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const width = isMobile ? 600 : 800;
    const height = isMobile ? 350 : 400;
    const padding = {
        top: 40,
        right: isMobile ? 20 : 40,
        bottom: 60,
        left: isMobile ? 50 : 60
    };

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    /* ---------- Score domain ---------- */
    const allScores: number[] = [0];

    players.forEach(player => {
        let cumulative = 0;
        player.pointsHistory?.forEach(p => {
            cumulative += p;
            allScores.push(cumulative);
        });
        allScores.push(player.totalScore);
    });

    const minScore = Math.min(...allScores, 0);
    const maxScore = Math.max(...allScores, 100);
    const scoreRange = maxScore - minScore || 100;

    /* ---------- Scales ---------- */
    const maxRounds = Math.max(currentRound, 1);
    const scaleX = (round: number) =>
        padding.left + (round / maxRounds) * chartWidth;

    const scaleY = (score: number) =>
        padding.top +
        chartHeight -
        ((score - minScore) / scoreRange) * chartHeight;

    /* ---------- Grid ---------- */
    const gridLines = Array.from({ length: 6 }, (_, i) => {
        const score = minScore + (scoreRange / 5) * i;
        return {
            score: Math.round(score),
            y: scaleY(score),
        };
    });

    // Generate x-axis labels - show fewer labels on mobile
    const maxLabels = isMobile ? 4 : 6;
    const numLabels = Math.min(currentRound + 1, maxLabels);
    const xLabels = Array.from({ length: numLabels }, (_, i) => {
        const round = i === numLabels - 1 ? currentRound : Math.round((currentRound / (numLabels - 1)) * i);
        return { round, x: scaleX(round) };
    });

    return (
        <div className="w-full p-2 sm:p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg">
            <div className="mb-1">
                <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent">
                    Points History
                </h2>
            </div>

            {/* ✅ Fully responsive without scrolling */}
            <svg viewBox={`0 0 ${width} ${height}`}
                 preserveAspectRatio="xMidYMid meet"
                 className="w-full h-auto max-h-[350px] sm:max-h-[450px]">
                {/* Grid */}
                {gridLines.map((line, i) => (
                    <g key={i}>
                        <line
                            x1={padding.left}
                            y1={line.y}
                            x2={width - padding.right}
                            y2={line.y}
                            stroke="#ffffff90"
                            strokeDasharray="3 3"
                        />
                        <text
                            x={padding.left - 12}
                            y={line.y + 5}
                            fill="#ffffff"
                            fontSize={isMobile ? "12" : "14"}
                            textAnchor="end"
                        >
                            {line.score}
                        </text>
                    </g>
                ))}

                {/* X labels */}
                {xLabels.map((label, i) => (
                    <text
                        key={i}
                        x={label.x}
                        y={height - padding.bottom + 30}
                        fill="#ffffff"
                        fontSize={isMobile ? "12" : "14"}
                        textAnchor="middle"
                    >
                        {label.round === 0 ? 'Start' : `R${label.round}`}
                    </text>
                ))}

                {/* Lines */}
                {players.map((player, index) => {
                    const color = PLAYER_COLORS[index % PLAYER_COLORS.length];
                    let cumulative = 0;

                    // Start from round 0 with score 0
                    const points = [{ round: 0, score: 0 }];

                    player.pointsHistory?.forEach((p, round) => {
                        cumulative += p;
                        points.push({ round: round + 1, score: cumulative });
                    });

                    if (points.length < 2) return null;

                    const path = points
                        .map((p, i) => {
                            const x = scaleX(p.round);
                            const y = scaleY(p.score);
                            return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
                        })
                        .join(' ');

                    return (
                        <g key={player.userId}>
                            <path
                                d={path}
                                stroke={color}
                                strokeWidth={isMobile ? 3 : 3.5}
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />

                            {points.map(p => {
                                const x = scaleX(p.round);
                                const y = scaleY(p.score);
                                // Don't show circle for round 0 (starting point)
                                if (p.round === 0) return null;

                                return (
                                    <circle
                                        key={p.round}
                                        cx={x}
                                        cy={y}
                                        r={isMobile ? 5 : 6}
                                        fill={color}
                                        stroke="#1f2937"
                                        strokeWidth={isMobile ? 2 : 2.5}
                                        style={{ cursor: 'pointer' }}
                                        onMouseEnter={() =>
                                            setHoveredPoint({
                                                playerName: player.name,
                                                round: p.round,
                                                score: p.score,
                                                x,
                                                y,
                                            })
                                        }
                                        onMouseLeave={() =>
                                            setHoveredPoint(null)
                                        }
                                        onTouchStart={() =>
                                            setHoveredPoint({
                                                playerName: player.name,
                                                round: p.round,
                                                score: p.score,
                                                x,
                                                y,
                                            })
                                        }
                                        onTouchEnd={() =>
                                            setTimeout(() => setHoveredPoint(null), 2000)
                                        }
                                    />
                                );
                            })}
                        </g>
                    );
                })}

                {/* Tooltip */}
                {hoveredPoint && (
                    <g>
                        <rect
                            x={hoveredPoint.x + 10}
                            y={hoveredPoint.y - 45}
                            width={isMobile ? 140 : 160}
                            height={isMobile ? 50 : 55}
                            rx={8}
                            fill="#1f2937"
                            stroke="#374151"
                            strokeWidth={1.5}
                        />
                        <text
                            x={hoveredPoint.x + 20}
                            y={hoveredPoint.y - 23}
                            fill="white"
                            fontSize={isMobile ? 12 : 14}
                            fontWeight={600}
                        >
                            Round {hoveredPoint.round}
                        </text>
                        <text
                            x={hoveredPoint.x + 20}
                            y={hoveredPoint.y - 7}
                            fill="#9ca3af"
                            fontSize={isMobile ? 11 : 13}
                        >
                            {hoveredPoint.playerName}: {hoveredPoint.score} pts
                        </text>
                    </g>
                )}
            </svg>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 justify-center">
                {players.map((player, i) => (
                    <div key={player.userId} className="flex items-center gap-2">
                        <span
                            className="w-4 h-4 rounded-full"
                            style={{
                                backgroundColor:
                                    PLAYER_COLORS[i % PLAYER_COLORS.length],
                            }}
                        />
                        <span className="text-base text-gray-300 font-small">
                            {player.name}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}