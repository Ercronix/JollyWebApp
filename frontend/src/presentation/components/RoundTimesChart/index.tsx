import {useState} from 'react';
import type {RoundDurations} from '@/core/roundTimes';
import {roundTimeStats} from '@/core/roundTimes';
import {formatDuration} from '@/core/duration';

const MINUTE = 60_000;
// Axis steps in minutes; the smallest one that needs at most 4 steps above zero wins
const STEPS = [1, 2, 5, 10, 15, 30, 60, 120, 240];

function axisLabel(minutes: number) {
    if (minutes < 60) return `${minutes}m`;
    const rest = minutes % 60;
    return `${Math.floor(minutes / 60)}h${rest ? `${rest}m` : ''}`;
}

interface RoundTimesChartProps {
    // Null when the game's round times weren't recorded
    durations: RoundDurations | null;
}

const Stat = ({label, children}: { label: string; children: React.ReactNode }) => (
    <div className="min-w-0">
        <div className="text-xs text-fg-muted">{label}</div>
        <div className="text-[15px] sm:text-base font-bold tabular-nums truncate text-fg">{children}</div>
    </div>
);

export function RoundTimesChart({durations}: RoundTimesChartProps) {
    const [hovered, setHovered] = useState<{ round: number; ms: number; x: number; y: number } | null>(null);

    const header = (
        <figcaption className="px-1 mb-1">
            <h2 className="text-[17px] sm:text-xl font-extrabold text-fg">
                Round Times
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

    const stats = roundTimeStats(durations.rounds);
    // Every bar to draw: the finished rounds, then the one still running
    const bars = durations.rounds.map((ms, i) => ({round: i + 1, ms, live: false}));
    if (durations.liveMs !== null) bars.push({round: bars.length + 1, ms: durations.liveMs, live: true});

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

    /* ---------- Scales ---------- */
    const maxMinutes = Math.max(...bars.map(b => b.ms), MINUTE) / MINUTE;
    const step = STEPS.find(s => Math.ceil(maxMinutes / s) <= 4) ?? STEPS[STEPS.length - 1];
    const maxY = Math.ceil(maxMinutes / step) * step;

    const scaleY = (ms: number) => padding.top + chartHeight - (ms / MINUTE / maxY) * chartHeight;
    const slot = chartWidth / Math.max(bars.length, 1);
    const barWidth = Math.max(slot * 0.6, 2);
    const barX = (index: number) => padding.left + index * slot + (slot - barWidth) / 2;

    const gridLines = [];
    for (let minutes = 0; minutes <= maxY; minutes += step) {
        gridLines.push({minutes, y: scaleY(minutes * MINUTE)});
    }

    const maxLabels = isMobile ? 4 : 6;
    const numLabels = Math.min(bars.length, maxLabels);
    const xLabels = Array.from({length: numLabels}, (_, i) => {
        const index = numLabels === 1 ? 0 : Math.round(((bars.length - 1) / (numLabels - 1)) * i);
        return {round: bars[index].round, x: barX(index) + barWidth / 2};
    });

    const showAverage = stats !== null && durations.rounds.length >= 2;

    // The tooltip sits right of the bar, or left of it where it would run off the chart
    const tooltip = hovered && (() => {
        const tooltipWidth = isMobile ? 150 : 130;
        const fitsRight = hovered.x + 10 + tooltipWidth <= width;
        return {width: tooltipWidth, x: fitsRight ? hovered.x + 10 : hovered.x - 10 - tooltipWidth};
    })();

    return (
        <figure className="m-0 w-full px-2.5 pt-3.5 pb-3.5 sm:p-4 rounded-[18px] bg-surface border border-line">
            {header}

            <div className="grid grid-cols-4 gap-2 px-1 mt-2">
                <Stat label="Total">{formatDuration(stats ? stats.totalMs : durations.liveMs ?? 0)}</Stat>
                <Stat label="Avg">{stats ? formatDuration(stats.averageMs) : '–'}</Stat>
                <Stat label="Longest">{stats ? `R${stats.longest.round} ${formatDuration(stats.longest.ms)}` : '–'}</Stat>
                <Stat label="Shortest">{stats ? `R${stats.shortest.round} ${formatDuration(stats.shortest.ms)}` : '–'}</Stat>
            </div>

            <svg viewBox={`0 0 ${width} ${height}`}
                 preserveAspectRatio="xMidYMid meet"
                 className="w-full h-auto max-h-[350px] sm:max-h-[450px]">
                {/* Grid */}
                {gridLines.map((line) => (
                    <g key={line.minutes}>
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
                            {axisLabel(line.minutes)}
                        </text>
                    </g>
                ))}

                {/* X labels */}
                {xLabels.map((label) => (
                    <text
                        key={label.round}
                        x={label.x}
                        y={height - padding.bottom + 30}
                        fill="#9aa39d"
                        fontSize={isMobile ? "18" : "15"}
                        textAnchor="middle"
                    >
                        {`R${label.round}`}
                    </text>
                ))}

                {/* Bars */}
                {bars.map((bar, index) => {
                    const x = barX(index);
                    const barHeight = Math.max(padding.top + chartHeight - scaleY(bar.ms), 2);
                    const y = padding.top + chartHeight - barHeight;
                    const show = () => setHovered({round: bar.round, ms: bar.ms, x: x + barWidth / 2, y});

                    return (
                        <rect
                            key={bar.round}
                            data-round={bar.round}
                            data-live={bar.live ? 'true' : undefined}
                            x={x}
                            y={y}
                            width={barWidth}
                            height={barHeight}
                            rx={Math.min(4, barWidth / 2)}
                            fill="var(--color-accent)"
                            opacity={bar.live ? 0.4 : 1}
                            style={{cursor: 'pointer'}}
                            onMouseEnter={show}
                            onMouseLeave={() => setHovered(null)}
                            onTouchStart={show}
                            onTouchEnd={() => setTimeout(() => setHovered(null), 2000)}
                        />
                    );
                })}

                {/* Average of the finished rounds */}
                {showAverage && (
                    <line
                        data-average
                        x1={padding.left}
                        y1={scaleY(stats.averageMs)}
                        x2={width - padding.right}
                        y2={scaleY(stats.averageMs)}
                        stroke="#f3f0e8"
                        strokeOpacity={0.6}
                        strokeWidth={2}
                        strokeDasharray="8 6"
                    />
                )}

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
                            Round {hovered.round}
                        </text>
                        <text
                            x={tooltip.x + 10}
                            y={hovered.y - 2}
                            fill="#9aa39d"
                            fontSize={isMobile ? 17 : 14}
                        >
                            {formatDuration(hovered.ms)}
                        </text>
                    </g>
                )}
            </svg>
        </figure>
    );
}
