import React, { useState } from "react";
import { Button } from "@/presentation/components/Button";
import { Input } from "@/presentation/components/input";
import { Text } from "@/presentation/components/Text";
import { useJoinLobbyByCode, useGetLobbyByCode } from "@/core/api/hooks";
import { useNavigate } from "@tanstack/react-router";

interface JoinByCodeModalProps {
    userId: string;
    onClose: () => void;
}

export const JoinByCodeModal: React.FC<JoinByCodeModalProps> = ({ userId, onClose }) => {
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
                userId,
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
            console.error("Failed to join lobby:", error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-purple-900/90 to-blue-900/90 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <Text size="xl" weight="bold" className="text-white">
                        Join Private Lobby
                    </Text>
                    <button
                        onClick={onClose}
                        className="text-white/70 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <Text size="sm" className="text-gray-300 mb-2">
                            Enter 6-character access code
                        </Text>
                        <Input
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
                            className="w-full text-center text-2xl font-mono tracking-widest uppercase bg-white/10 border-white/30 text-white placeholder-gray-500"
                        />
                    </div>

                    {code.length === 6 && !previewCode && (
                        <Button
                            onClick={handlePreview}
                            colorscheme="cyanToBlue"
                            variant="outline"
                            className="w-full"
                        >
                            Preview Lobby
                        </Button>
                    )}

                    {isLoadingPreview && (
                        <div className="text-center py-4">
                            <Text className="text-gray-400">Loading lobby details...</Text>
                        </div>
                    )}

                    {lobbyPreview && (
                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <Text size="sm" className="text-gray-400 mb-1">Lobby Name</Text>
                            <Text size="lg" weight="bold" className="text-white mb-3">
                                {lobbyPreview.name}
                            </Text>
                            <Text size="sm" className="text-gray-400 mb-1">Players</Text>
                            <Text className="text-white">{lobbyPreview.playerCount} player(s)</Text>
                        </div>
                    )}

                    {lobbyPreview && (
                        <div className="flex gap-3">
                            <Button
                                onClick={() => {
                                    setPreviewCode(undefined);
                                    setCode("");
                                }}
                                colorscheme="pinkToOrange"
                                variant="outline"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleJoin}
                                colorscheme="greenToBlue"
                                variant="solid"
                                disabled={joinMutation.isPending}
                                className="flex-1"
                            >
                                {joinMutation.isPending ? "Joining..." : "Join Lobby"}
                            </Button>
                        </div>
                    )}

                    {joinMutation.isError && (
                        <Text size="sm" className="text-red-400 text-center">
                            Failed to join lobby. Please check the code and try again.
                        </Text>
                    )}
                </div>
            </div>
        </div>
    );
};