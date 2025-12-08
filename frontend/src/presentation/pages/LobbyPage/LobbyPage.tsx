// src/presentation/pages/LobbyPage.tsx
import React, { useState, useEffect } from "react";
import { Button } from "@/presentation/components/Button";
import { Input } from "@/presentation/components/input";
import { Text } from "@/presentation/components/Text";
import { DeleteConfirmationModal } from "@/presentation/components/DeleteConfirmationModal";
import { useNavigate } from "@tanstack/react-router";
import { UserModel } from "@/core/models/UserModel";
import type { Lobby } from "@/core/api/client";
import {
    useLobbies,
    useCreateLobby,
    useJoinLobby,
    useLogout,
    useDeleteLobby,
} from "@/core/api/hooks";

export function LobbyPage() {
    const navigate = useNavigate();
    const [lobbyName, setLobbyName] = useState("");
    const [currentUser, setCurrentUser] = useState(() => UserModel.getInstance().getCurrentUser());
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; lobby: Lobby | null }>({
        show: false,
        lobby: null,
    });

    const { data: lobbies = [], isLoading, refetch } = useLobbies();
    const createLobbyMutation = useCreateLobby();
    const joinLobbyMutation = useJoinLobby();
    const logoutMutation = useLogout();
    const deleteLobbyMutation = useDeleteLobby();

    // Check if user is logged in
    useEffect(() => {
        if (!currentUser) {
            navigate({ to: "/" });
        }
    }, [currentUser, navigate]);

    const handleCreateLobby = async () => {
        if (!lobbyName.trim() || !currentUser) return;

        try {
            const lobby = await createLobbyMutation.mutateAsync({
                name: lobbyName.trim(),
                userId: currentUser.id,
            });

            // Navigate to game with the gameId from the lobby
            if (lobby.gameId) {
                await navigate({
                    to: "/Game",
                    search: {
                        gameId: lobby.gameId,
                        lobbyName: lobby.name,
                    },
                });
            }
        } catch (error) {
            console.error('Failed to create lobby:', error);
        }
    };

    const handleJoinLobby = async (lobby: Lobby) => {
        if (!currentUser) return;

        try {
            const result = await joinLobbyMutation.mutateAsync({
                lobbyId: lobby.id,
                userId: currentUser.id,
            });

            // Get gameId from lobby service
            const gameId = result.lobby.gameId || lobby.gameId;

            if (gameId) {
                await navigate({
                    to: "/Game",
                    search: {
                        gameId: gameId,
                        lobbyName: lobby.name,
                    },
                });
            }
        } catch (error) {
            console.error('Failed to join lobby:', error);
        }
    };

    const handleDeleteLobby = (lobby: Lobby) => {
        setDeleteConfirmation({ show: true, lobby });
    };

    const confirmDeleteLobby = async () => {
        if (!deleteConfirmation.lobby || !currentUser) return;

        try {
            await deleteLobbyMutation.mutateAsync({
                lobbyId: deleteConfirmation.lobby.id,
                userId: currentUser.id,
            });
            setDeleteConfirmation({ show: false, lobby: null });
        } catch (error) {
            console.error('Failed to delete lobby:', error);
        }
    };

    const cancelDeleteLobby = () => {
        setDeleteConfirmation({ show: false, lobby: null });
    };

    const handleLogout = async () => {
        try {
            await logoutMutation.mutateAsync();
            UserModel.getInstance().clearUser();
            setCurrentUser(null);
            navigate({ to: "/" });
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    if (!currentUser) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Text size="lg" className="text-gray-400">
                    Redirecting to login...
                </Text>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-12 py-8">
            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={deleteConfirmation.show}
                title="Delete Lobby?"
                message="Are you sure you want to delete"
                itemName={deleteConfirmation.lobby?.name}
                onConfirm={confirmDeleteLobby}
                onCancel={cancelDeleteLobby}
                isDeleting={deleteLobbyMutation.isPending}
            />

            {/* Header with User Info */}
            <div className="text-center space-y-6 animate-in fade-in duration-1000">
                <div className="relative">
                    <Text
                        as="h1"
                        size="3xl"
                        weight="bold"
                        className="bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent animate-pulse text-4xl md:text-5xl lg:text-6xl"
                    >
                        Game Lobbies
                    </Text>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 opacity-20 blur-xl"></div>
                </div>

                <div className="space-y-2">
                    <Text size="lg" className="text-gray-300 animate-in slide-in-from-bottom-4 duration-1000 delay-300">
                        Welcome, <span className="text-purple-300 font-semibold">{currentUser.username}</span>!
                    </Text>
                    <Text size="lg" className="text-gray-400">
                        Join a lobby or create one to start
                    </Text>
                </div>

                <div className="flex justify-center gap-8 mt-8">
                    <div className="text-center group">
                        <div className="text-2xl font-bold text-white group-hover:text-purple-300 transition-colors">
                            {lobbies.length}
                        </div>
                        <div className="text-sm text-gray-400">Active Lobbies</div>
                    </div>
                </div>
            </div>

            {/* User Controls */}
            <div className="flex gap-4 items-center">
                <Button
                    colorscheme="pinkToOrange"
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="hover:scale-110 transition-transform"
                    disabled={logoutMutation.isPending}
                >
                    🚪 Switch User
                </Button>
            </div>

            {/* Lobby List */}
            <div className="w-full max-w-4xl space-y-4">
                <div className="text-center mb-6">
                    <Text size="xl" weight="semibold" className="text-white mb-2">
                        Available Lobbies
                    </Text>
                    <div className="w-24 h-1 bg-gradient-to-r from-purple-400 to-blue-400 mx-auto rounded-full"></div>
                </div>

                {isLoading ? (
                    <div className="text-center text-gray-400">Loading lobbies...</div>
                ) : lobbies.length === 0 ? (
                    <div className="text-center text-gray-400">No lobbies available. Create one!</div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {lobbies.map((lobby: Lobby, index: number) => (
                            <div
                                key={lobby.id}
                                className="group relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-6 shadow-lg hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 hover:-translate-y-2 hover:scale-105 animate-in slide-in-from-bottom-8 duration-700"
                                style={{
                                    animationDelay: `${index * 150}ms`,
                                }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/50 via-pink-500/50 to-blue-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-sm"></div>

                                {/* Delete Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteLobby(lobby);
                                    }}
                                    className="absolute top-3 right-3 z-20 bg-red-500/80 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center transition-all duration-300 hover:scale-110 opacity-0 group-hover:opacity-100"
                                    disabled={deleteLobbyMutation.isPending}
                                    aria-label="Delete lobby"
                                >
                                    🗑️
                                </button>

                                <div className="relative z-10 space-y-4">
                                    <Text size="lg" weight="semibold" className="text-white group-hover:text-purple-300 transition-colors">
                                        {lobby.name}
                                    </Text>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-300">Players</span>
                                        <span className="text-white font-medium">{lobby.playerCount}</span>
                                    </div>

                                    <div className="pt-2">
                                        <Button
                                            size="sm"
                                            colorscheme="purpleToBlue"
                                            variant="solid"
                                            className="w-full group-hover:scale-105 transition-transform duration-300"
                                            onClick={() => handleJoinLobby(lobby)}
                                            disabled={joinLobbyMutation.isPending}
                                        >
                                            {joinLobbyMutation.isPending ? 'Joining...' : `Join as ${currentUser.username}`}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Lobby */}
            <div className="w-full max-w-2xl relative">
                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-8 shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 hover:scale-105 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10 animate-pulse"></div>

                    <div className="relative z-10 space-y-6">
                        <div className="text-center space-y-2">
                            <Text size="xl" weight="semibold" className="text-white">
                                Create a Lobby
                            </Text>
                            <div className="w-24 h-1 bg-gradient-to-r from-green-400 to-blue-400 mx-auto rounded-full"></div>
                            <Text size="sm" className="text-purple-300">
                                You'll be the host as <span className="font-semibold">{currentUser.username}</span>
                            </Text>
                        </div>

                        <div className="space-y-4">
                            <div className="relative">
                                <Input
                                    value={lobbyName}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLobbyName(e.target.value)}
                                    placeholder="Enter lobby name..."
                                    className="text-white bg-white/5 border-white/30 focus:border-purple-400 focus:ring-purple-400/50 placeholder-gray-400 transition-all duration-300 hover:bg-white/10"
                                    disabled={createLobbyMutation.isPending}
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                            </div>

                            <Button
                                colorscheme="greenToBlue"
                                variant="solid"
                                className="w-full text-lg py-3 hover:scale-105 transition-transform duration-300"
                                onClick={handleCreateLobby}
                                disabled={!lobbyName.trim() || createLobbyMutation.isPending}
                            >
                                {createLobbyMutation.isPending ? 'Creating...' : 'Create Lobby 🚀'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
                <Button
                    colorscheme="purpleToBlue"
                    variant="ghost"
                    size="md"
                    className="group hover:scale-110 transition-transform duration-300"
                    onClick={() => refetch()}
                    disabled={isLoading}
                >
                    <span className="group-hover:animate-spin inline-block mr-2">🔄</span>
                    Refresh Lobbies
                </Button>
            </div>
        </div>
    );
}