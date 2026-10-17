// Calm tones on the dark panel: ivory, coral, champagne, sky, then softer tints for seats 5 to 8
export const PLAYER_COLORS = [
    '#f3f0e8',
    '#e5737f',
    '#cdb27a',
    '#8ab4d8',
    '#b79ce6',
    '#e9a3bd',
    '#8fcca5',
    '#d9c49b',
];

export const playerColor = (seat: number) => PLAYER_COLORS[seat % PLAYER_COLORS.length];
