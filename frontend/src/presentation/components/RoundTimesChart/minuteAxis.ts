const MINUTE = 60_000;
// Axis steps in minutes; the smallest one that needs at most 4 steps above zero wins
const STEPS = [1, 2, 5, 10, 15, 30, 60, 120, 240];

/**
 * A minutes axis from 0 that covers maxMs (at least a minute), in at most 4 steps
 */
export function minuteAxis(maxMs: number): { step: number; max: number } {
    const maxMinutes = Math.max(maxMs, MINUTE) / MINUTE;
    const step = STEPS.find(s => Math.ceil(maxMinutes / s) <= 4) ?? STEPS[STEPS.length - 1];
    return {step, max: Math.ceil(maxMinutes / step) * step};
}

export function axisLabel(minutes: number) {
    if (minutes < 60) return `${minutes}m`;
    const rest = minutes % 60;
    return `${Math.floor(minutes / 60)}h${rest ? `${rest}m` : ''}`;
}
