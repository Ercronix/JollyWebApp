// src/presentation/components/PlayerPointsChart/index.tsx
import { useState } from 'react';
import type {Player} from "../../../types";

// Color palette for different players
const PLAYER_COLORS = [
    '#a78bfa', // purple
    '#60a5fa', // blue
    '#34d399', // green
    '#fbbf24', // yellow
    '#f87171', // red
    '#fb923c', // orange
    '#ec4899', // pink
    '#14b8a6', // teal
];

interface PlayerPointsGraphProps {
    players: Player[];
    currentRound: number;
}

export function PlayerPointsChart({ players, currentRound }: PlayerPointsGraphProps) {
    const [hoveredPoint, setHoveredPoint] = useState<{ playerName: string; round: number; score: number; x: number; y: number } | null>(null);

    if (!players || players.length === 0) {
        return null;
    }

    // Chart dimensions
    const width = 800;
    const height = 400;
    const padding = { top: 40, right: 120, bottom: 60, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Calculate max rounds and max score
    const maxRounds = Math.max(
        ...players.map(p => (p.pointsHistory?.length || 1) - 1),
        currentRound
    );

    // Calculate cumulative scores for all players to find the true max
    const allCumulativeScores: number[] = [0];
    players.forEach(player => {
        if (player.pointsHistory && player.pointsHistory.length > 0) {
            let cumulative = 0;
            player.pointsHistory.forEach(score => {
                cumulative += score;
                allCumulativeScores.push(cumulative);
            });
        }
        // Also include current total score
        allCumulativeScores.push(player.totalScore);
    });

    const maxScore = Math.max(...allCumulativeScores, 100);
    const minScore = Math.min(...allCumulativeScores, 0);
    const scoreRange = maxScore - minScore || 100;

    // Scaling functions
    const scaleX = (round: number) => padding.left + (round / maxRounds) * chartWidth;
    const scaleY = (score: number) => padding.top + chartHeight - ((score - minScore) / scoreRange) * chartHeight;

    // Generate grid lines
    const gridLines = [];
    const numYLines = 5;
    for (let i = 0; i <= numYLines; i++) {
        const score = minScore + (scoreRange / numYLines) * i;
        const y = scaleY(score);
        gridLines.push({ score: Math.round(score), y });
    }

    // Generate X-axis labels
    const xLabels = [];
    const labelInterval = Math.max(1, Math.floor(maxRounds / 10));
    for (let round = 0; round <= maxRounds; round += labelInterval) {
        xLabels.push({ round, x: scaleX(round) });
    }

    return (
        <div className="w-full p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg">
            <div className="mb-4">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent">
                    📈 Points History
                </h2>
                <p className="text-gray-400 text-sm mt-1">Track each player's total score progression</p>
            </div>

            <div className="relative w-full overflow-x-auto">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="w-full"
                    style={{ minWidth: '600px' }}
                >
                    {/* Grid lines */}
                    {gridLines.map((line, i) => (
                        <g key={i}>
                            <line
                                x1={padding.left}
                                y1={line.y}
                                x2={width - padding.right}
                                y2={line.y}
                                stroke="#ffffff20"
                                strokeDasharray="3 3"
                                strokeWidth="1"
                            />
                            <text
                                x={padding.left - 10}
                                y={line.y + 4}
                                fill="#9ca3af"
                                fontSize="12"
                                textAnchor="end"
                            >
                                {line.score}
                            </text>
                        </g>
                    ))}

                    {/* X-axis labels */}
                    {xLabels.map((label, i) => (
                        <text
                            key={i}
                            x={label.x}
                            y={height - padding.bottom + 25}
                            fill="#9ca3af"
                            fontSize="12"
                            textAnchor="middle"
                        >
                            {label.round === 0 ? 'Start' : label.round}
                        </text>
                    ))}

                    {/* X-axis label */}
                    <text
                        x={width / 2}
                        y={height - 10}
                        fill="#9ca3af"
                        fontSize="14"
                        textAnchor="middle"
                    >
                        Round
                    </text>

                    {/* Y-axis label */}
                    <text
                        x={20}
                        y={height / 2}
                        fill="#9ca3af"
                        fontSize="14"
                        textAnchor="middle"
                        transform={`rotate(-90 20 ${height / 2})`}
                    >
                        Total Score
                    </text>

                    {/* Plot lines for each player */}
                    {players.map((player, playerIndex) => {
                        const color = PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];
                        const points: { round: number; score: number }[] = [];

                        // Calculate cumulative scores from pointsHistory
                        if (player.pointsHistory && player.pointsHistory.length > 0) {
                            let cumulativeScore = 0;
                            for (let round = 0; round < player.pointsHistory.length; round++) {
                                cumulativeScore += player.pointsHistory[round];
                                points.push({ round, score: cumulativeScore });
                            }
                        } else {
                            // Fallback: if no history, just show current total at current round
                            if (currentRound > 0) {
                                points.push({ round: currentRound, score: player.totalScore });
                            }
                        }

                        // Skip players with no points
                        if (points.length === 0) return null;

                        // Create path data
                        const pathData = points
                            .map((point, i) => {
                                const x = scaleX(point.round);
                                const y = scaleY(point.score);
                                return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
                            })
                            .join(' ');

                        return (
                            <g key={player.userId}>
                                {/* Line */}
                                <path
                                    d={pathData}
                                    stroke={color}
                                    strokeWidth="3"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />

                                {/* Points */}
                                {points.map((point, i) => {
                                    const x = scaleX(point.round);
                                    const y = scaleY(point.score);
                                    const isHovered = hoveredPoint?.playerName === player.name && hoveredPoint?.round === point.round;

                                    return (
                                        <circle
                                            key={i}
                                            cx={x}
                                            cy={y}
                                            r={isHovered ? 7 : 5}
                                            fill={color}
                                            stroke="#1f2937"
                                            strokeWidth="2"
                                            style={{ cursor: 'pointer' }}
                                            onMouseEnter={() => setHoveredPoint({ playerName: player.name, round: point.round, score: point.score, x, y })}
                                            onMouseLeave={() => setHoveredPoint(null)}
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
                                y={hoveredPoint.y - 40}
                                width="140"
                                height="50"
                                fill="#1f2937"
                                fillOpacity="0.95"
                                stroke="#ffffff33"
                                strokeWidth="1"
                                rx="6"
                            />
                            <text
                                x={hoveredPoint.x + 20}
                                y={hoveredPoint.y - 20}
                                fill="white"
                                fontSize="12"
                                fontWeight="600"
                            >
                                {hoveredPoint.round === 0 ? 'Start' : `Round ${hoveredPoint.round}`}
                            </text>
                            <text
                                x={hoveredPoint.x + 20}
                                y={hoveredPoint.y - 5}
                                fill="#9ca3af"
                                fontSize="11"
                            >
                                {hoveredPoint.playerName}: {hoveredPoint.score} pts
                            </text>
                        </g>
                    )}
                </svg>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-6 justify-center">
                {players.map((player, index) => (
                    <div key={player.userId} className="flex items-center gap-2">
                        <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: PLAYER_COLORS[index % PLAYER_COLORS.length] }}
                        />
                        <span className="text-sm text-gray-300">{player.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}