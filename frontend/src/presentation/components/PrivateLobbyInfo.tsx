import React, { useState } from "react";
import { Button } from "@/presentation/components/Button";
import { Text } from "@/presentation/components/Text";
import { logger } from "@/utils/logger";

interface PrivateLobbyInfoProps {
    accessCode: string;
    lobbyName: string;
}

export const PrivateLobbyInfo: React.FC<PrivateLobbyInfoProps> = ({
                                                                      accessCode,
    lobbyName,
                                                                  }) => {
    const [copied, setCopied] = useState(false);

    const shareUrl = `${window.location.origin}/join/${accessCode}`;
    const shareText = `Join my game "${lobbyName}"! Use code: ${accessCode}`;

    const copyCode = () => {
        void navigator.clipboard.writeText(accessCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const copyLink = () => {
        void navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Join ${lobbyName}`,
                    text: shareText,
                    url: shareUrl,
                });
                logger.debug('Shared successfully');
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    logger.error('Error sharing:', error);
                    // Fallback to copy
                    copyLink();
                }
            }
        } else {
            copyLink();
        }
    };

    return (
        <div className="bg-surface text-fg border border-line rounded-[18px] p-4 space-y-3">
            <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <Text className="text-[17px] font-extrabold text-fg">
                    Private Lobby
                </Text>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 bg-ground border border-line-strong rounded-xl px-4 py-2">
                        <Text size="lg" weight="bold" className="text-fg font-mono tracking-[0.12em]">
                            {accessCode}
                        </Text>
                    </div>
                    <Button
                        size="sm"
                        colorscheme="accent"
                        variant="solid"
                        onClick={copyCode}
                        className="whitespace-nowrap"
                    >
                        {copied ? "✓ Copied!" : "Copy Code"}
                    </Button>
                </div>

                <Button
                    size="sm"
                    colorscheme="subtle"
                    variant="solid"
                    onClick={handleNativeShare}
                    className="w-full"
                >
                    📤 Share Invite
                </Button>

                <Button
                    size="sm"
                    colorscheme="subtle"
                    variant="outline"
                    onClick={copyLink}
                    className="w-full"
                >
                    Copy Link
                </Button>
            </div>

            <Text size="sm" className="text-fg-muted">
                Share this code or link with friends to let them join
            </Text>
        </div>
    );
};