import {useState} from 'react';
import type {Player} from '@/types';
import type {RoundDurations} from '@/core/roundTimes';
import {formatDuration} from '@/core/duration';
import {playerColor} from '../PlayerPointsChart/playerColors';
import {PlayerLegend} from '../PlayerPointsChart/PlayerLegend';
import {scoreAxis} from '../PlayerPointsChart/scoreAxis';
import {axisLabel, minuteAxis} from '../RoundTimesChart/minuteAxis';

const MINUTE = 60_000;

interface PointsOverTimeChartProps {
    players: Player[];
    // Null when the game's round times weren't recorded
    durations: RoundDurations | null;
}

/**
 * The points race on a time axis: each round's points sit where the round ended,
 * over a band per round that is as wide as the round took
 */
export function PointsOverTimeChart({players, durations}: PointsOverTimeChartProps) {
    const [hovered, setHovered] = useState<{
        playerName: string;
        round: number;
        score: number;
        x: number;
        y: number;
    } | null>(null);

    const header = (
        <figcaption className="px-1 mb-1">
            <h2 className="text-[17px] sm:text-xl font-extrabold text-fg">
                Points Over Time
            </h2>
        </figcaption>
    );

    if (!durations) {
        return (
            <figure className="m-0 w-full px-2.5 pt-3.5 pb-3.5 sm:p-4 rounded-[18px] bg-surface border border-line">
                {header}
                <p className="px-1 py-8 text-center text-sm text-fg-muted">
                    Round times weren't recorded for this game.
                </p>
            </figure>
        );
    }

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

    /* ---------- Rounds on the time axis ---------- */
    // When each finished round ended, counted from the start of the game
    const ends: number[] = [];
    durations.rounds.forEach((ms, i) => ends.push((i === 0 ? 0 : ends[i - 1]) + ms));
    const finishedMs = ends.length ? ends[ends.length - 1] : 0;

    const bands = durations.rounds.map((ms, i) => ({round: i + 1, start: ends[i] - ms, ms, live: false}));
    if (durations.liveMs !== null) {
        bands.push({round: bands.length + 1, start: finishedMs, ms: durations.liveMs, live: true});
    }

    /* ---------- Scales ---------- */
    // The axis ends where the game is now, so the lines use the full width
    const spanMs = Math.max(finishedMs + (durations.liveMs ?? 0), MINUTE);
    const timeStep = minuteAxis(spanMs).step;
    const {minScore, maxScore, step} = scoreAxis(players);

    const scaleX = (ms: number) => padding.left + (ms / spanMs) * chartWidth;
    const scaleY = (score: number) =>
        padding.top + chartHeight - ((score - minScore) / (maxScore - minScore)) * chartHeight;

    const gridLines = [];
    for (let score = minScore; score <= maxScore; score += step) {
        gridLines.push({score, y: scaleY(score)});
    }

    const timeTicks = [];
    for (let minutes = 0; minutes * MINUTE <= spanMs; minutes += timeStep) {
        timeTicks.push({minutes, x: scaleX(minutes * MINUTE)});
    }

    // The tooltip sits right of the point, or left of it where it would run off the chart
    const tooltip = hovered && (() => {
        const tooltipWidth = isMobile ? 220 : 200;
        const fitsRight = hovered.x + 10 + tooltipWidth <= width;
        return {width: tooltipWidth, x: fitsRight ? hovered.x + 10 : hovered.x - 10 - tooltipWidth};
    })();

    return (
        <figure className="m-0 w-full px-2.5 pt-3.5 pb-3.5 sm:p-4 rounded-[18px] bg-surface border border-line">
            {header}

            <svg viewBox={`0 0 ${width} ${height}`}
                 preserveAspectRatio="xMidYMid meet"
                 className="w-full h-auto max-h-[350px] sm:max-h-[450px]">
                {/* A band per round, as wide as the round took */}
                {bands.map((band, i) => {
                    const x = scaleX(band.start);
                    const bandWidth = Math.max(scaleX(band.start + band.ms) - x, 0);
                    return (
                        <g key={band.round}>
                            <rect
                                data-band={band.round}
                                data-live={band.live ? 'true' : undefined}
                                x={x}
                                y={padding.top}
                                width={bandWidth}
                                height={chartHeight}
                                fill={band.live ? 'var(--color-accent-soft)' : i % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)'}
                            />
                            {/* Only where the label fits */}
                            {bandWidth >= 36 && (
                                <text
                                    x={x + bandWidth / 2}
                                    y={padding.top - 12}
                                    fill="#9aa39d"
                                    fontSize={isMobile ? "16" : "13"}
                                    textAnchor="middle"
                                >
                                    {`R${band.round}`}
                                </text>
                            )}
                        </g>
                    );
                })}

                {/* Grid */}
                {gridLines.map((line) => (
                    <g key={line.score}>
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

                {/* Time labels */}
                {timeTicks.map((tick) => (
                    <text
                        key={tick.minutes}
                        x={tick.x}
                        y={height - padding.bottom + 30}
                        fill="#9aa39d"
                        fontSize={isMobile ? "18" : "15"}
                        textAnchor="middle"
                    >
                        {axisLabel(tick.minutes)}
                    </text>
                ))}

                {/* Lines, up to the last finished round */}
                {players.map((player, index) => {
                    const color = playerColor(index);
                    const points = [{round: 0, ms: 0, score: 0}];
                    let cumulative = 0;
                    player.pointsHistory?.slice(0, ends.length).forEach((p, i) => {
                        cumulative += p;
                        points.push({round: i + 1, ms: ends[i], score: cumulative});
                    });

                    if (points.length < 2) return null;

                    const path = points
                        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.ms)} ${scaleY(p.score)}`)
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

                            {points.slice(1).map(p => {
                                const x = scaleX(p.ms);
                                const y = scaleY(p.score);
                                const show = () => setHovered({playerName: player.name, round: p.round, score: p.score, x, y});

                                return (
                                    <circle
                                        key={p.round}
                                        cx={x}
                                        cy={y}
                                        r={5}
                                        fill={color}
                                        stroke="#1a2520"
                                        strokeWidth={isMobile ? 2 : 2.5}
                                        style={{cursor: 'pointer'}}
                                        onMouseEnter={show}
                                        onMouseLeave={() => setHovered(null)}
                                        onTouchStart={show}
                                        onTouchEnd={() => setTimeout(() => setHovered(null), 2000)}
                                    />
                                );
                            })}
                        </g>
                    );
                })}

                {/* Tooltip */}
                {hovered && tooltip && (
                    <g>
                        <rect
                            x={tooltip.x}
                            y={hovered.y - 48}
                            width={tooltip.width}
                            height={isMobile ? 62 : 58}
                            rx={8}
                            fill="#222f29"
                            stroke="rgba(255,255,255,0.12)"
                        />
                        <text
                            x={tooltip.x + 10}
                            y={hovered.y - 24}
                            fill="#ece9e2"
                            fontSize={isMobile ? 18 : 15}
                            fontWeight={600}
                        >
                            {`Round ${hovered.round} · ${formatDuration(durations.rounds[hovered.round - 1])}`}
                        </text>
                        <text
                            x={tooltip.x + 10}
                            y={hovered.y - 2}
                            fill="#9aa39d"
                            fontSize={isMobile ? 17 : 14}
                        >
                            {`${hovered.playerName}: ${hovered.score} pts`}
                        </text>
                    </g>
                )}
            </svg>

            <PlayerLegend players={players}/>
        </figure>
    );
}
