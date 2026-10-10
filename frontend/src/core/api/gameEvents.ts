import type {Game} from "@/types";

/**
 * SSE events carry the game without its lobby fields (only GET /api/games/:id adds them),
 * so keep the cached ones until the refetch that follows every event replaces them.
 */
export function mergeEventGame(cached: Game | undefined, incoming: Game): Game {
    return {
        ...incoming,
        ownerId: incoming.ownerId ?? cached?.ownerId,
        lobbyPlayerIds: incoming.lobbyPlayerIds ?? cached?.lobbyPlayerIds,
    };
}
