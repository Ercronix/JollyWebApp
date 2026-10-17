import { useState } from 'react';
import type { Player } from '../../../types';
import { suitForSeat } from '@/core/suits';
import { formatDuration } from '@/core/duration';

// Calm tones on the dark panel: ivory, coral, champagne, sky, then softer tints for seats 5 to 8
const PLAYER_COLORS = [
    '#f3f0e8',
    '#e5737f',
    '#cdb27a',
    '#8ab4d8',
    '#b79ce6',
    '#e9a3bd',
    '#8fcca5',
    '#d9c49b',
];

interface PlayerPointsGraphProps {
    players: Player[];
    currentRound: number;
    // How long each finished round took, shown in the tooltip
    roundDurations?: number[];
}

export function PlayerPointsChart({ players, currentRound, roundDurations }: PlayerPointsGraphProps) {
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
    const hoveredDuration = hoveredPoint ? roundDurations?.[hoveredPoint.round - 1] : undefined;
    const tooltip = hoveredPoint && (() => {
        const tooltipWidth = (isMobile ? 190 : 170) + (hoveredDuration === undefined ? 0 : 60);
        const fitsRight = hoveredPoint.x + 10 + tooltipWidth <= width;
        return {width: tooltipWidth, x: fitsRight ? hoveredPoint.x + 10 : hoveredPoint.x - 10 - tooltipWidth};
    })();

    return (
        <figure className="m-0 w-full px-2.5 pt-3.5 pb-3.5 sm:p-4 rounded-[18px] bg-surface border border-line">
            <figcaption className="px-1 mb-1">
                <h2 className="text-[17px] sm:text-xl font-extrabold text-fg">
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
                            stroke="rgba(255,255,255,0.07)"
                            strokeDasharray="3 3"
                        />
                        <text
                            x={padding.left - 12}
                            y={line.y + 5}
                            fill="#9aa39d"
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
                        fill="#9aa39d"
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
                                strokeWidth={3}
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
                                        r={5}
                                        fill={color}
                                        stroke="#1a2520"
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
                            fill="#222f29"
                            stroke="rgba(255,255,255,0.12)"
                        />
                        <text
                            x={tooltip.x + 10}
                            y={hoveredPoint.y - 24}
                            fill="#ece9e2"
                            fontSize={isMobile ? 18 : 15}
                            fontWeight={600}
                        >
                            {hoveredDuration === undefined
                                ? `Round ${hoveredPoint.round}`
                                : `Round ${hoveredPoint.round} · ${formatDuration(hoveredDuration)}`}
                        </text>
                        <text
                            x={tooltip.x + 10}
                            y={hoveredPoint.y - 2}
                            fill="#9aa39d"
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
                    <li key={player.userId} className="flex items-center gap-1.5 text-[13px] font-medium text-fg">
                        <span
                            aria-hidden="true"
                            className="w-3 h-[3px] rounded-full"
                            style={{ backgroundColor: PLAYER_COLORS[i % PLAYER_COLORS.length] }}
                        />
                        <span>{suitForSeat(i).symbol} {player.name}</span>
                    </li>
                ))}
            </ul>
        </figure>
    );
}