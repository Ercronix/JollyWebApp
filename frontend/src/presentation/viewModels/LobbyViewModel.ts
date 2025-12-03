// useLobbyViewModel.ts
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { UserModel, type User } from "@/core/models/UserModel";

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

    // reactive user state (so view re-renders when we clear/set user)
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        return UserModel.getInstance().getCurrentUser();
    });

    // on mount, ensure we have a logged-in user; otherwise redirect to "/"
    useEffect(() => {
        const userModel = UserModel.getInstance();
        const u = userModel.getCurrentUser();
        setCurrentUser(u);

        if (!u) {
            // not logged in -> redirect to login/landing
            navigate({ to: "/" });
        }
        // we intentionally run this only on mount; user model changes happen via setUser/clearUser
        // which should be done by other app flows (login/logout) and we update local state there.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
        // ensure user still exists
        const user = UserModel.getInstance().getCurrentUser();
        if (!user) {
            // if not logged in, send to root
            navigate({ to: "/" });
            return;
        }

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
        setLobbies(() =>
            (initialLobbies ?? DEFAULT_LOBBIES).map((l) => ({
                ...l,
                playerCount: Math.max(1, Math.floor(Math.random() * 8) + 1),
            }))
        );
    }, [initialLobbies]);

    const handleLogout = useCallback(() => {
        const userModel = UserModel.getInstance();
        userModel.clearUser();
        setCurrentUser(null);
        navigate({ to: "/" });
    }, [navigate]);

    return {
        lobbies,
        lobbyName,
        setLobbyName,
        joinLobby,
        createLobby,
        refreshLobbies,
        currentUser,
        handleLogout,
    } as const;
}
