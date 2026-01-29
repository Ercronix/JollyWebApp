import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { useJoinLobbyByCode, useCurrentUser } from '@/core/api/hooks';
import { Text } from '@/presentation/components/Text';
import { MainLayout } from '@/presentation/layout/MainLayout';

type JoinParams = {
    code: string;
};

export const Route = createFileRoute('/Join/$code')({
    component: JoinByCode,
});

function JoinByCode() {
    const { code } = Route.useParams() as JoinParams;
    const navigate = useNavigate();
    const { data: currentUser, isLoading: isLoadingUser } = useCurrentUser();
    const joinMutation = useJoinLobbyByCode();

    // Use ref to track if we've already attempted to join
    const hasAttemptedJoin = useRef(false);

    useEffect(() => {
        // If user is not logged in, store the code and redirect to login
        if (!isLoadingUser && !currentUser) {
            console.log('User not logged in, storing code and redirecting to login');
            localStorage.setItem('pendingJoinCode', code);
            void navigate({ to: '/' });
            return;
        }

        if (currentUser && code && !hasAttemptedJoin.current && !joinMutation.isPending) {
            console.log('User logged in, joining lobby with code:', code);
            hasAttemptedJoin.current = true; // Mark as attempted

            joinMutation.mutate(
                { accessCode: code.toUpperCase(), userId: currentUser.id },
                {
                    onSuccess: (result) => {
                        console.log('Successfully joined lobby:', result);
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
                        console.error('Failed to join lobby:', error);
                        // Redirect to lobby page on error with error message
                        void navigate({ to: '/lobby' });
                    },
                }
            );
        }
    }, [currentUser, isLoadingUser, code]); // Remove joinMutation and navigate from deps

    return (
        <MainLayout>
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
        </MainLayout>
    );
}