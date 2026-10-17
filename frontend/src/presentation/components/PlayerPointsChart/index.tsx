import { useState } from 'react';
import type { Player } from '../../../types';
import { suitForSeat } from '@/core/suits';

// Picked to stand out on the felt: cream, coral, gold, sky, then lighter tints for seats 5 to 8
const PLAYER_COLORS = [
    '#fffdf8',
    '#ff8c7a',
    '#f2b544',
    '#8cc8ff',
    '#c9a7ff',
    '#ffb3d1',
    '#9be8c0',
    '#ffd9a0',
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

    function getScoreStep(maxScore: number) {
        if (maxScore <= 300) return 50;
        if (maxScore <= 800) return 100;
        if (maxScore <= 1500) return 200;
        return 500;
    }


    /* ---------- Score domain ---------- */
    const allScores: number[] = [0];

    players.forEach(player => {
        let cumulative = 0;
        // Use pointsHistory length to determine actual rounds played
        player.pointsHistory?.forEach(p => {
            cumulative += p;
            allScores.push(cumulative);
        });

        // Always include the player's total score to ensure it's in range
        allScores.push(player.totalScore);
    });

    const rawMinScore = Math.min(...allScores, 0);
    const rawMaxScore = Math.max(...allScores, 100);

    const paddedMax = rawMaxScore + 50;
    const step = getScoreStep(paddedMax);

    const minScore = Math.floor(rawMinScore / step) * step;
    const maxScore = Math.ceil(paddedMax / step) * step;
    /* ---------- Scales ---------- */
    // Use the actual maximum rounds from player histories
    const maxHistoryRounds = Math.max(
        ...players.map(p => p.pointsHistory?.length || 0),
        1
    );

    const scaleX = (round: number) =>
        padding.left + (round / maxHistoryRounds) * chartWidth;

    const scaleY = (score: number) =>
        padding.top +
        chartHeight -
        ((score - minScore) / (maxScore - minScore)) * chartHeight;


    /* ---------- Grid ---------- */
    const gridLines = [];
    for (let score = minScore; score <= maxScore; score += step) {
        gridLines.push({
            score,
            y: scaleY(score),
        });
    }

    const maxLabels = isMobile ? 4 : 6;
    const numLabels = Math.min(maxHistoryRounds + 1, maxLabels);
    const xLabels = Array.from({ length: numLabels }, (_, i) => {
        const round = i === numLabels - 1 ? maxHistoryRounds : Math.round((maxHistoryRounds / (numLabels - 1)) * i);
        return { round, x: scaleX(round) };
    });

    // The tooltip sits right of the point, or left of it where it would run off the chart
    const tooltip = hoveredPoint && (() => {
        const tooltipWidth = isMobile ? 190 : 170;
        const fitsRight = hoveredPoint.x + 10 + tooltipWidth <= width;
        return {width: tooltipWidth, x: fitsRight ? hoveredPoint.x + 10 : hoveredPoint.x - 10 - tooltipWidth};
    })();

    return (
        <figure className="m-0 w-full px-2.5 pt-3 pb-3.5 sm:p-4 rounded-[18px] bg-black/25 border border-on-felt/10">
            <figcaption className="px-1 mb-1">
                <h2 className="font-display text-xl sm:text-2xl font-extrabold text-on-felt">
                    Points History
                </h2>
            </figcaption>

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
                            stroke="rgba(243,239,228,0.16)"
                            strokeDasharray="3 3"
                        />
                        <text
                            x={padding.left - 12}
                            y={line.y + 5}
                            fill="#c9d8cf"
                            fontSize={isMobile ? "18" : "15"}
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
                        fill="#c9d8cf"
                        fontSize={isMobile ? "18" : "15"}
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
                                strokeWidth={isMobile ? 4 : 3.5}
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
                                        r={isMobile ? 6 : 6}
                                        fill={color}
                                        stroke="#0f3b2e"
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
                {hoveredPoint && tooltip && (
                    <g>
                        <rect
                            x={tooltip.x}
                            y={hoveredPoint.y - 48}
                            width={tooltip.width}
                            height={isMobile ? 62 : 58}
                            rx={8}
                            fill="#fffdf8"
                        />
                        <text
                            x={tooltip.x + 10}
                            y={hoveredPoint.y - 24}
                            fill="#1b1d1c"
                            fontSize={isMobile ? 18 : 15}
                            fontWeight={600}
                        >
                            Round {hoveredPoint.round}
                        </text>
                        <text
                            x={tooltip.x + 10}
                            y={hoveredPoint.y - 2}
                            fill="#4b504d"
                            fontSize={isMobile ? 17 : 14}
                        >
                            {hoveredPoint.playerName}: {hoveredPoint.score} pts
                        </text>
                    </g>
                )}
            </svg>

            {/* Legend: each player's suit, as on their card */}
            <ul aria-label="Players" className="flex flex-wrap gap-x-3.5 gap-y-1.5 justify-center mt-1">
                {players.map((player, i) => (
                    <li key={player.userId} className="flex items-center gap-1.5 text-sm font-semibold text-on-felt">
                        <span
                            aria-hidden="true"
                            className="w-3.5 h-1 rounded-full"
                            style={{ backgroundColor: PLAYER_COLORS[i % PLAYER_COLORS.length] }}
                        />
                        <span>{suitForSeat(i).symbol} {player.name}</span>
                    </li>
                ))}
            </ul>
        </figure>
    );
}