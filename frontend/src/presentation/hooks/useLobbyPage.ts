import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useLobby } from "@/presentation/hooks/useLobby";
import { userService } from "@/core/services/userService";

// Type definitions
export type Lobby = {
    id: number;
    name: string;
    playerCount: number;
};

export function useLobbyPage(initialLobbies?: Lobby[]) {
    const navigate = useNavigate();
    const currentUser = userService.getUser();
    const { lobbies: fetchedLobbies, isLoading, createLobby: createLobbyMutation } = useLobby();

    const [lobbyName, setLobbyName] = useState("");

    // Use initial lobbies if provided, otherwise use fetched lobbies
    const lobbies = initialLobbies || fetchedLobbies;

    // Redirect to home if not logged in
    useEffect(() => {
        if (!currentUser) {
            navigate({ to: "/" });
        }
    }, [currentUser, navigate]);

    const handleLogout = () => {
        userService.clearUser();
        navigate({ to: "/" });
    };

    const createLobby = () => {
        if (!lobbyName.trim()) {
            return;
        }

        createLobbyMutation(lobbyName);
        setLobbyName(""); // Clear input after creating
    };

    const joinLobby = (lobby: Lobby) => {
        navigate({
            to: "/Game",
            search: {
                lobbyId: lobby.id,
                lobbyName: lobby.name,
                playerCount: lobby.playerCount,
            },
        });
    };

    const refreshLobbies = () => {
        // React Query will automatically refetch when we invalidate
        // This is already handled by the useLobby hook
        window.location.reload(); // Simple refresh for now
    };

    return {
        currentUser,
        lobbies,
        isLoading,
        lobbyName,
        setLobbyName,
        createLobby,
        joinLobby,
        handleLogout,
        refreshLobbies,
    };
}