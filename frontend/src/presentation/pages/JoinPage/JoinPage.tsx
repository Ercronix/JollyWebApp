import { useNavigate, useParams } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { useJoinLobbyByCode, useCurrentUser } from '@/core/api/hooks';
import { Text } from '@/presentation/components/Text';
import { logger } from '@/utils/logger';

export function JoinPage() {
    const { code } = useParams({ from: '/Join/$code' });
    const navigate = useNavigate();
    const { data: currentUser, isLoading: isLoadingUser } = useCurrentUser();
    const joinMutation = useJoinLobbyByCode();
    const { mutate: joinLobby } = joinMutation;

    // Use ref to track if we've already attempted to join
    const hasAttemptedJoin = useRef(false);

    useEffect(() => {
        // If user is not logged in, store the code and redirect to login
        if (!isLoadingUser && !currentUser) {
            logger.debug('User not logged in, storing code and redirecting to login');
            localStorage.setItem('pendingJoinCode', code);
            void navigate({ to: '/' });
            return;
        }

        if (currentUser && code && !hasAttemptedJoin.current) {
            logger.debug('User logged in, joining lobby with code:', code);
            hasAttemptedJoin.current = true; // Mark as attempted

            joinLobby(
                { accessCode: code.toUpperCase() },
                {
                    onSuccess: (result) => {
                        logger.debug('Successfully joined lobby:', result);
                        if (result.lobby.gameId) {
                            void navigate({
                                to: '/Game',
                                search: {
                                    gameId: result.lobby.gameId,
                                    lobbyName: result.lobby.name,
                                    lobbyId: result.lobby.id,
                                    accessCode: code.toUpperCase(),
                                },
                            });
                        }
                    },
                    onError: (error) => {
                        logger.error('Failed to join lobby:', error);
                        // Redirect to lobby page on error with error message
                        void navigate({ to: '/lobby' });
                    },
                }
            );
        }
    }, [currentUser, isLoadingUser, code, joinLobby, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-400 mx-auto"></div>
                <Text size="xl" className="text-white">
                    {isLoadingUser
                        ? 'Checking authentication...'
                        : joinMutation.isPending
                            ? 'Joining lobby...'
                            : 'Loading...'}
                </Text>
                {joinMutation.isError && (
                    <div className="space-y-2">
                        <Text size="sm" className="text-red-400">
                            Failed to join lobby. Invalid or expired code.
                        </Text>
                        <Text size="sm" className="text-gray-400">
                            Redirecting to lobby page...
                        </Text>
                    </div>
                )}
            </div>
        </div>
    );
}