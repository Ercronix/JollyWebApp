export type Suit = {
    symbol: "♠" | "♥" | "♦" | "♣";
    isRed: boolean;
};

const SUITS: Suit[] = [
    {symbol: "♠", isRed: false},
    {symbol: "♥", isRed: true},
    {symbol: "♦", isRed: true},
    {symbol: "♣", isRed: false},
];

/**
 * The suit shown on a player's card, by their seat (turn order). Purely decorative.
 */
export function suitForSeat(index: number): Suit {
    return SUITS[index % SUITS.length];
}
