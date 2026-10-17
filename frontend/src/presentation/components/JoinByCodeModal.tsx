import React, { useState } from "react";
import { Button } from "@/presentation/components/Button";
import { Input } from "@/presentation/components/input";
import { Text } from "@/presentation/components/Text";
import { Sheet } from "@/presentation/components/Sheet";
import { useJoinLobbyByCode, useGetLobbyByCode } from "@/core/api/hooks";
import { useNavigate } from "@tanstack/react-router";
import { logger } from "@/utils/logger";

interface JoinByCodeModalProps {
    onClose: () => void;
}

export const JoinByCodeModal: React.FC<JoinByCodeModalProps> = ({ onClose }) => {
    const [code, setCode] = useState("");
    const [previewCode, setPreviewCode] = useState<string | undefined>();
    const navigate = useNavigate();

    const { data: lobbyPreview, isLoading: isLoadingPreview } = useGetLobbyByCode(previewCode);
    const joinMutation = useJoinLobbyByCode();

    const handlePreview = () => {
        if (code.length === 6) {
            setPreviewCode(code.toUpperCase());
        }
    };

    const handleJoin = async () => {
        try {
            const result = await joinMutation.mutateAsync({
                accessCode: code.toUpperCase(),
            });

            if (result.lobby.gameId) {
                await navigate({
                    to: "/Game",
                    search: {
                        gameId: result.lobby.gameId,
                        lobbyName: result.lobby.name,
                        lobbyId: result.lobby.id,
                        accessCode: code.toUpperCase(),
                    },
                });
            }
        } catch (error) {
            logger.error("Failed to join lobby:", error);
        }
    };

    return (
        <Sheet isOpen onClose={onClose} title="Join private lobby">
                <div className="space-y-4">
                    <div>
                        <label htmlFor="join-code" className="block text-sm text-fg-muted mb-2">
                            Enter the 6-character access code
                        </label>
                        <Input
                            id="join-code"
                            autoComplete="off"
                            autoCapitalize="characters"
                            autoCorrect="off"
                            spellCheck={false}
                            type="text"
                            value={code}
                            onChange={(e) => {
                                const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                                if (val.length <= 6) {
                                    setCode(val);
                                    setPreviewCode(undefined);
                                }
                            }}
                            placeholder="ABC123"
                            maxLength={6}
                            className="w-full h-14 text-center text-2xl font-mono font-bold tracking-widest uppercase"
                        />
                    </div>

                    {code.length === 6 && !previewCode && (
                        <Button
                            onClick={handlePreview}
                            colorscheme="subtle"
                            variant="outline"
                            className="w-full min-h-12"
                        >
                            Preview Lobby
                        </Button>
                    )}

                    {isLoadingPreview && (
                        <div className="text-center py-4">
                            <Text className="text-fg-muted">Loading lobby details...</Text>
                        </div>
                    )}

                    {lobbyPreview && (
                        <div className="bg-surface-2 rounded-xl p-4">
                            <Text size="sm" className="text-fg-muted mb-1">Lobby Name</Text>
                            <Text size="lg" weight="bold" className="text-fg mb-3">
                                {lobbyPreview.name}
                            </Text>
                            <Text size="sm" className="text-fg-muted mb-1">Players</Text>
                            <Text className="text-fg">{lobbyPreview.playerCount} player(s)</Text>
                        </div>
                    )}
                    {lobbyPreview && (
                        <div className="flex gap-3">
                            <Button
                                onClick={() => {
                                    setPreviewCode(undefined);
                                    setCode("");
                                }}
                                colorscheme="subtle"
                                variant="outline"
                                className="flex-1 min-h-12"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleJoin}
                                colorscheme="accent"
                                variant="solid"
                                disabled={joinMutation.isPending}
                                className="flex-1 min-h-12"
                            >
                                {joinMutation.isPending ? "Joining..." : "Join Lobby"}
                            </Button>
                        </div>
                    )}

                    {joinMutation.isError && (
                        <Text size="sm" className="text-bad font-semibold text-center">
                            Failed to join lobby. Please check the code and try again.
                        </Text>
                    )}
                </div>
        </Sheet>
    );
};