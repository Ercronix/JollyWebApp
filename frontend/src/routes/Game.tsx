import { createFileRoute } from '@tanstack/react-router';
import { GamePage } from '../presentation/pages/GamePage/GamePage';

type GameSearch = {
    gameId?: string;
    lobbyName?: string;
    lobbyId?: string;
    accessCode?: string;
};

export const Route = createFileRoute('/Game')({
    validateSearch: (search): GameSearch => {
        return {
            gameId: (search.gameId as string) || undefined,
            lobbyName: (search.lobbyName as string) || undefined,
            lobbyId: (search.lobbyId as string) || undefined,
        };
    },
    component: GamePage,
});