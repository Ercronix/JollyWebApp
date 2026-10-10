import type {Game} from "@/types";

/**
 * SSE events carry the game without its lobby's ownerId (only GET /api/games/:id adds it),
 * so keep the cached one; only OWNER_CHANGED (which refetches) changes it.
 */
export function mergeEventGame(cached: Game | undefined, incoming: Game): Game {
    return {...incoming, ownerId: incoming.ownerId ?? cached?.ownerId};
}
