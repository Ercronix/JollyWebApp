import type {Game} from "@/types";

export interface RoundDurations {
    // Milliseconds each finished round took, in order
    rounds: number[];
    // How long the current round has been running; null once the game is finished
    liveMs: number | null;
}

export interface RoundTimeStats {
    totalMs: number;
    averageMs: number;
    longest: { round: number; ms: number };
    shortest: { round: number; ms: number };
}

/**
 * How long each round took, from the end of the previous one (or the game's start).
 * Null when the game's round times weren't recorded, e.g. for games from before they were.
 */
export function roundDurations(
    game: Pick<Game, "createdAt" | "currentRound" | "isFinished" | "roundEndedAt">,
    now: number,
): RoundDurations | null {
    const finishedRounds = game.isFinished ? game.currentRound : game.currentRound - 1;
    if (!game.roundEndedAt || game.roundEndedAt.length < finishedRounds) return null;

    const ends = game.roundEndedAt.slice(0, finishedRounds).map(t => new Date(t).getTime());
    const start = new Date(game.createdAt).getTime();
    const rounds = ends.map((end, i) => end - (i === 0 ? start : ends[i - 1]));
    const lastEnd = ends.length ? ends[ends.length - 1] : start;

    return {rounds, liveMs: game.isFinished ? null : Math.max(0, now - lastEnd)};
}

/**
 * Total, average, longest and shortest of the finished rounds (rounds are numbered from 1)
 */
export function roundTimeStats(rounds: number[]): RoundTimeStats | null {
    if (!rounds.length) return null;

    const totalMs = rounds.reduce((a, b) => a + b, 0);
    let longest = 0;
    let shortest = 0;
    rounds.forEach((ms, i) => {
        if (ms > rounds[longest]) longest = i;
        if (ms < rounds[shortest]) shortest = i;
    });

    return {
        totalMs,
        averageMs: totalMs / rounds.length,
        longest: {round: longest + 1, ms: rounds[longest]},
        shortest: {round: shortest + 1, ms: rounds[shortest]},
    };
}
