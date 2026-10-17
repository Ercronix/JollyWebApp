import type {Game, Player} from "@/types";

export type DerivedGameState = {
    allPlayersSubmitted: boolean;
    submittedCount: number;
    // Players still playing (removed ones keep their points but don't submit)
    activePlayerCount: number;
    currentUserPlayer: Player | undefined;
    hasCurrentUserSubmitted: boolean;
    currentDealer: Player | undefined;
    highestTotalScore: number;
    isOwner: boolean;
    // Leaving as the last real player archives a played game and deletes an unplayed one
    isLastLobbyPlayer: boolean;
    hasScores: boolean;
};

/**
 * Values the game page computes from the server's game state
 */
export function deriveGameState(game: Game | undefined, currentUserId: string | undefined): DerivedGameState {
    const players = game?.players ?? [];
    const activePlayers = players.filter(p => !p.hasLeft);
    const submittedCount = activePlayers.filter(p => p.hasSubmitted).length;
    const currentUserPlayer = activePlayers.find(p => p.userId === currentUserId);

    return {
        // An empty game is never "complete", otherwise auto-advance would fire
        allPlayersSubmitted: activePlayers.length > 0 && submittedCount === activePlayers.length,
        submittedCount,
        activePlayerCount: activePlayers.length,
        currentUserPlayer,
        hasCurrentUserSubmitted: currentUserPlayer?.hasSubmitted ?? false,
        currentDealer: players.find(p => p.userId === game?.currentDealer),
        highestTotalScore: players.length ? Math.max(...players.map(p => p.totalScore)) : 0,
        isOwner: !!game?.ownerId && game.ownerId === currentUserId,
        isLastLobbyPlayer: game?.lobbyPlayerIds?.length === 1 && game.lobbyPlayerIds[0] === currentUserId,
        // Keep in sync with GamesService.hasScores
        hasScores: (game?.currentRound ?? 1) > 1 || players.some(p => p.hasSubmitted),
    };
}

/**
 * Whether the current user may edit another player's past scores: the admin may always edit the
 * guests they added (nobody else can), and real players' only in admin mode
 */
export function canEditOthersHistory(
    player: Player | null | undefined,
    {isOwner, isAdminMode}: {isOwner: boolean; isAdminMode: boolean},
): boolean {
    return isOwner && (isAdminMode || !!player?.isTemporary);
}
