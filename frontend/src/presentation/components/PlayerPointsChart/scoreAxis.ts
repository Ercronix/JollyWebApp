import type {Player} from '@/types';

function getScoreStep(maxScore: number) {
    if (maxScore <= 300) return 50;
    if (maxScore <= 800) return 100;
    if (maxScore <= 1500) return 200;
    return 500;
}

/**
 * The score axis for the points charts: covers every cumulative score, with headroom on top
 */
export function scoreAxis(players: Player[]): { minScore: number; maxScore: number; step: number } {
    const allScores: number[] = [0];

    players.forEach(player => {
        let cumulative = 0;
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

    return {
        minScore: Math.floor(rawMinScore / step) * step,
        maxScore: Math.ceil(paddedMax / step) * step,
        step,
    };
}
