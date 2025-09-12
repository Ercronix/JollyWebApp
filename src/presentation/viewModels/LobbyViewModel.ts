import { useCallback, useState } from "react";
import { useNavigate } from "@tanstack/react-router";

export type Lobby = {
    id: number;
    name: string;
    playerCount: number;
};

const DEFAULT_LOBBIES: Lobby[] = [
    { id: 1, name: "Chill Gamers", playerCount: 2 },
    { id: 2, name: "Pro Squad", playerCount: 4 },
    { id: 3, name: "Casual Lounge", playerCount: 1 },
    { id: 4, name: "Night Owls", playerCount: 6 },
];

export function useLobbyViewModel(initialLobbies?: Lobby[]) {
    const navigate = useNavigate();
    const [lobbies, setLobbies] = useState<Lobby[]>(initialLobbies ?? DEFAULT_LOBBIES);
    const [lobbyName, setLobbyName] = useState<string>("");

    const joinLobby = useCallback(
        (lobby: Lobby) => {
            navigate({
                to: "/Game",
                search: {
                    lobbyId: lobby.id,
                    lobbyName: lobby.name,
                    playerCount: lobby.playerCount,
                },
            });
        },
        [navigate]
    );

    const createLobby = useCallback(() => {
        const newLobby: Lobby = {
            id: Date.now(),
            name: lobbyName.trim() || "New Lobby",
            playerCount: 1,
        };

        setLobbies((prev) => [...prev, newLobby]);
        setLobbyName("");

        navigate({
            to: "/Game",
            search: {
                lobbyId: newLobby.id,
                lobbyName: newLobby.name,
                playerCount: newLobby.playerCount,
            },
        });
    }, [navigate, lobbyName]);

    const refreshLobbies = useCallback(() => {
        // simple simulated refresh: randomize player counts for demo
        setLobbies(() =>
            (initialLobbies ?? DEFAULT_LOBBIES).map((l) => ({
                ...l,
                playerCount: Math.max(1, Math.floor(Math.random() * 8) + 1),
            }))
        );
    }, [initialLobbies]);

    return {
        lobbies,
        lobbyName,
        setLobbyName,
        joinLobby,
        createLobby,
        refreshLobbies,
    } as const;
}
