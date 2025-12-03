import { createFileRoute } from '@tanstack/react-router';
import { GamePage } from '../presentation/pages/GamePage/GamePage';

type GameSearch = {
    lobbyId?: number;
    lobbyName?: string;
    playerCount?: number;
};

export const Route = createFileRoute('/Game')({
    validateSearch: (search): GameSearch => {
        return {
            lobbyId: Number(search.lobbyId) || undefined,
            lobbyName: (search.lobbyName as string) || undefined,
            playerCount: Number(search.playerCount) || undefined,
        };
    },
    component: GamePage,
});