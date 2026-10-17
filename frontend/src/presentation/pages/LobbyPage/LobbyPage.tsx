// src/presentation/pages/LobbyPage.tsx
import React, {useState, useEffect} from "react";
import {Button} from "@/presentation/components/Button";
import {Input} from "@/presentation/components/input";
import {Text} from "@/presentation/components/Text";
import {DeleteConfirmationModal} from "@/presentation/components/DeleteConfirmationModal";
import {ArchiveConfirmationModal} from "@/presentation/components/ArchiveConfirmationModal";
import { JoinByCodeModal } from "@/presentation/components/JoinByCodeModal";
import { PrivateLobbyInfo } from "@/presentation/components/PrivateLobbyInfo";
import { SecureAccountModal } from "@/presentation/components/SecureAccountModal";
import { Sheet } from "@/presentation/components/Sheet";
import { LobbyCard } from "./components/LobbyCard";
import { useLogoutFlow } from "@/core/hooks/useLogoutFlow";
import {useNavigate} from "@tanstack/react-router";
import {UserModel} from "@/core/models/UserModel";
import type {Lobby} from "@/types";
import {
    useLobbies,
    useCreateLobby,
    useJoinLobby,
    useLogout,
    useDeleteLobby,
    useArchiveLobby,
    useCurrentUser,
} from "@/core/api/hooks";
import {logger} from "@/utils/logger";

export function LobbyPage() {
    const navigate = useNavigate();
    const [lobbyName, setLobbyName] = useState("");
    const [isPrivate, setIsPrivate] = useState(false);
    const [showJoinByCode, setShowJoinByCode] = useState(false);
    const [createdPrivateLobby, setCreatedPrivateLobby] = useState<Lobby | null>(null);
    const [storedUser, setStoredUser] = useState(() => UserModel.getInstance().getCurrentUser());
    const [showSecureAccount, setShowSecureAccount] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; lobby: Lobby | null }>({
        show: false,
        lobby: null,
    });
    const [archiveConfirmation, setArchiveConfirmation] = useState<{ show: boolean; lobby: Lobby | null }>({
        show: false,
        lobby: null,
    })

    const {data: lobbies = [], isLoading, refetch} = useLobbies();
    const createLobbyMutation = useCreateLobby();
    const joinLobbyMutation = useJoinLobby();
    const logoutMutation = useLogout();
    const deleteLobbyMutation = useDeleteLobby();
    const archiveLobbyMutation = useArchiveLobby();
    const {data: me} = useCurrentUser();
    // Prefer the server's copy: users stored before hasPassword existed lack it
    const currentUser = me ?? storedUser;

    useEffect(() => {
        if (me) UserModel.getInstance().setUser(me);
    }, [me]);

    // Check if user is logged in
    useEffect(() => {
        if (!currentUser) {
            void navigate({to: "/"});
        }
    }, [currentUser, navigate]);

    const handleCreateLobby = async () => {
        if (!currentUser) return;

        try {
            const trimmedName = lobbyName.trim();
            const fallbackName = new Date().toLocaleDateString();

            const lobby = await createLobbyMutation.mutateAsync({
                name: trimmedName || fallbackName,
                isPrivate: isPrivate, // ADD THIS LINE
            });

            if (lobby.isPrivate && lobby.accessCode) {
                setCreatedPrivateLobby(lobby);
            }

            setLobbyName("");
            setIsPrivate(false);

            if (lobby.isPrivate && lobby.accessCode) {
                setCreatedPrivateLobby(lobby);
                return;
            }

            if (lobby.gameId) {
                await navigate({
                    to: "/Game",
                    search: {
                        gameId: lobby.gameId,
                        lobbyName: lobby.name,
                        lobbyId: lobby.id,
                    },
                });
            }
        } catch (error) {
            logger.error('Failed to create lobby:', error);
        }
    };

    const handleHistorypage = async () => {
        await navigate({
            to: "/history"
        });
    }

    const handleJoinLobby = async (lobby: Lobby) => {
        if (!currentUser) return;

        try {
            const result = await joinLobbyMutation.mutateAsync({
                lobbyId: lobby.id,
            });

            // Get gameId from lobby service
            const gameId = result.lobby.gameId || lobby.gameId;

            if (gameId) {
                await navigate({
                    to: "/Game",
                    search: {
                        gameId: gameId,
                        lobbyName: lobby.name,
                        lobbyId: lobby.id,
                    },
                });
            }
        } catch (error) {
            logger.error('Failed to join lobby:', error);
        }
    };

    const handleDeleteLobby = (lobby: Lobby) => {
        setDeleteConfirmation({show: true, lobby});
    };

    const handleArchiveLobby = (lobby: Lobby) => {
        setArchiveConfirmation({show: true, lobby});
    }

    const confirmArchiveLobby = async () => {
        if (!archiveConfirmation.lobby) return;
        try {
            await archiveLobbyMutation.mutateAsync({
                lobbyId: archiveConfirmation.lobby.id
            });
            setArchiveConfirmation({show: false, lobby: null});
        } catch (error) {
            logger.error('Failed to archive lobby:', error);
        }
    };

    const confirmDeleteLobby = async () => {
        if (!deleteConfirmation.lobby || !currentUser) return;

        try {
            await deleteLobbyMutation.mutateAsync({
                lobbyId: deleteConfirmation.lobby.id,
            });
            setDeleteConfirmation({show: false, lobby: null});
        } catch (error) {
            logger.error('Failed to delete lobby:', error);
        }
    };

    const cancelDeleteLobby = () => {
        setDeleteConfirmation({show: false, lobby: null});
    };

    const cancelArchiveLobby = () => {
        setArchiveConfirmation({show: false, lobby: null});
    }

    const handleLogout = async () => {
        try {
            await logoutMutation.mutateAsync();
            UserModel.getInstance().clearUser();
            setStoredUser(null);
            void navigate({to: "/"});
        } catch (error) {
            logger.error('Logout failed:', error);
        }
    };
    const logoutFlow = useLogoutFlow(currentUser, handleLogout);

    const handleSecured = () => {
        setStoredUser(UserModel.getInstance().getCurrentUser());
    };

    if (!currentUser) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Text size="lg" className="text-on-felt-muted">
                    Redirecting to login...
                </Text>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
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

            <ArchiveConfirmationModal
                isOpen={archiveConfirmation.show}
                title="Archive Lobby?"
                message="Are you sure you want to archive"
                itemName={archiveConfirmation.lobby?.name}
                onConfirm={confirmArchiveLobby}
                onCancel={cancelArchiveLobby}
                isArchiving={archiveLobbyMutation.isPending}
            />

            <SecureAccountModal
                isOpen={showSecureAccount}
                fullTag={currentUser.fullTag}
                onClose={() => setShowSecureAccount(false)}
                onSecured={handleSecured}
            />

            <DeleteConfirmationModal
                isOpen={logoutFlow.showWarning}
                title="Log out without a password?"
                message="Without your tag you can't get back to your private games. Log out as"
                itemName={currentUser.fullTag}
                onConfirm={() => void logoutFlow.confirmLogout()}
                onCancel={logoutFlow.cancel}
                isDeleting={logoutMutation.isPending}
                confirmLabel="Log out anyway"
                confirmingLabel="Logging out..."
                extraAction={{
                    label: "Set password",
                    onClick: () => {
                        logoutFlow.cancel();
                        setShowSecureAccount(true);
                    },
                }}
            />

            <header className="flex items-center gap-1 -mr-2">
                <div className="flex-1 min-w-0">
                    <Text as="h1" className="font-display font-extrabold text-on-felt text-[32px] sm:text-4xl leading-tight">
                        Lobbies
                    </Text>
                    <Text size="sm" className="text-gold truncate">
                        {currentUser.fullTag || currentUser.username}
                    </Text>
                </div>
                <button type="button" aria-label="Game history" onClick={handleHistorypage}
                        className="w-11 h-11 flex-none flex items-center justify-center rounded-xl text-on-felt hover:bg-on-felt/10">
                    <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3 12a9 9 0 109-9 9.7 9.7 0 00-6.7 2.8L3 8"/>
                        <path d="M3 3v5h5M12 7v5l3 3"/>
                    </svg>
                </button>
                <button type="button" aria-label="Switch user" onClick={logoutFlow.requestLogout} disabled={logoutMutation.isPending}
                        className="w-11 h-11 flex-none flex items-center justify-center rounded-xl text-on-felt hover:bg-on-felt/10 disabled:opacity-50">
                    <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/>
                    </svg>
                </button>
            </header>

            {currentUser.hasPassword === false && (
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-[14px] bg-gold/15 border border-gold/45">
                    <Text size="sm" className="flex-1 text-gold-soft">
                        No password yet. Add one so you can always get back to your games.
                    </Text>
                    <Button colorscheme="gold" variant="outline" size="sm" className="min-h-11 whitespace-nowrap"
                            onClick={() => setShowSecureAccount(true)}>
                        Secure account
                    </Button>
                </div>
            )}

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    void handleCreateLobby();
                }}
                className="flex flex-col gap-2.5 p-3.5 rounded-[18px] bg-card text-ink shadow-[0_6px_16px_rgba(0,0,0,0.3)]"
            >
                <Text as="h2" className="font-display text-lg font-extrabold text-ink">New lobby</Text>
                <div className="flex gap-2">
                    <Input
                        value={lobbyName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLobbyName(e.target.value)}
                        placeholder="Lobby name"
                        aria-label="Lobby name"
                        enterKeyHint="go"
                        className="flex-1 min-w-0 h-12"
                        disabled={createLobbyMutation.isPending}
                    />
                    <Button type="submit" colorscheme="gold" variant="solid" className="h-12"
                            disabled={createLobbyMutation.isPending}>
                        {createLobbyMutation.isPending ? 'Creating...' : 'Create'}
                    </Button>
                </div>
                <label className="flex items-center justify-between min-h-11 cursor-pointer">
                    <Text className="text-ink text-[15px]">Private (join by code)</Text>
                    <input
                        type="checkbox"
                        checked={isPrivate}
                        onChange={(e) => setIsPrivate(e.target.checked)}
                        className="w-5 h-5 accent-felt cursor-pointer"
                    />
                </label>
            </form>

            <Button
                onClick={() => setShowJoinByCode(true)}
                colorscheme="felt"
                variant="outline"
                className="w-full min-h-12"
            >
                Join with a code
            </Button>

            <section aria-labelledby="open-lobbies" className="flex flex-col gap-2">
                <div className="flex items-center justify-between -mr-2">
                    <Text as="h2" id="open-lobbies" className="font-display text-lg font-extrabold text-on-felt">
                        Open lobbies <span className="font-sans text-on-felt-muted font-medium">· {lobbies.length}</span>
                    </Text>
                    <button type="button" aria-label="Refresh lobbies" onClick={() => refetch()} disabled={isLoading}
                            className="w-11 h-11 flex items-center justify-center rounded-xl text-on-felt hover:bg-on-felt/10 disabled:opacity-50">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M21 12a9 9 0 11-2.6-6.4L21 8"/>
                            <path d="M21 3v5h-5"/>
                        </svg>
                    </button>
                </div>

                {isLoading ? (
                    <Text className="text-center text-on-felt-muted py-6">Loading lobbies...</Text>
                ) : lobbies.length === 0 ? (
                    <Text className="text-center text-on-felt-muted py-6">No open lobbies. Create one above!</Text>
                ) : (
                    <ul className="flex flex-col gap-2">
                        {lobbies.map((lobby: Lobby) => (
                            <li key={lobby.id}>
                                <LobbyCard
                                    lobby={lobby}
                                    isJoining={joinLobbyMutation.isPending}
                                    onJoin={(l) => void handleJoinLobby(l)}
                                    onArchive={handleArchiveLobby}
                                    onDelete={handleDeleteLobby}
                                />
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {showJoinByCode && currentUser && (
                <JoinByCodeModal
                    onClose={() => setShowJoinByCode(false)}
                />
            )}

            <Sheet
                isOpen={!!(createdPrivateLobby && createdPrivateLobby.isPrivate && createdPrivateLobby.accessCode)}
                onClose={() => setCreatedPrivateLobby(null)}
                title="Private lobby created"
                footer={
                    <Button
                        colorscheme="gold"
                        variant="solid"
                        className="w-full min-h-12"
                        onClick={async () => {
                            if (createdPrivateLobby?.gameId) {
                                await navigate({
                                    to: "/Game",
                                    search: {
                                        gameId: createdPrivateLobby.gameId,
                                        lobbyName: createdPrivateLobby.name,
                                        lobbyId: createdPrivateLobby.id,
                                        accessCode: createdPrivateLobby.accessCode,
                                    },
                                });
                            }
                            setCreatedPrivateLobby(null);
                        }}
                    >
                        Join Game →
                    </Button>
                }
            >
                {createdPrivateLobby?.accessCode && (
                    <PrivateLobbyInfo
                        accessCode={createdPrivateLobby.accessCode}
                        lobbyName={createdPrivateLobby.name}
                    />
                )}
            </Sheet>
        </div>
    );
}