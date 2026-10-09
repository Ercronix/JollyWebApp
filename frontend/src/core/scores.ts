// Score rules shared by every score input. Keep in sync with backend/service/DefaultService.js.
export const MAX_SCORE = 100000;
export const MIN_WIN_CONDITION = 100;
export const MAX_WIN_CONDITION = 10000;

/**
 * Whether a partially typed value may be shown in a score input (whole numbers, optional minus)
 */
export function isScoreInput(value: string): boolean {
    return /^-?\d*$/.test(value);
}

/**
 * Parses a score input; NaN when it isn't a number yet (e.g. "" or "-")
 */
export function parseScore(value: string): number {
    return isScoreInput(value) ? parseInt(value, 10) : NaN;
}

/**
 * Returns an error message, or null when the score is valid
 */
export function validateScore(score: number): string | null {
    if (!Number.isInteger(score)) {
        return "Please enter a valid number";
    }
    if (Math.abs(score) > MAX_SCORE) {
        return `Score must be between -${MAX_SCORE} and ${MAX_SCORE}`;
    }
    if (score % 5 !== 0) {
        return "Score must be divisible by 5";
    }
    return null;
}

export function validateWinCondition(value: number): string | null {
    if (!Number.isInteger(value) || value < MIN_WIN_CONDITION || value > MAX_WIN_CONDITION) {
        return `Win condition must be a whole number between ${MIN_WIN_CONDITION} and ${MAX_WIN_CONDITION}`;
    }
    return null;
}
