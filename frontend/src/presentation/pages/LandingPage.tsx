// src/presentation/pages/LandingPage.tsx
import React, { useState } from "react";
import { Button } from "@/presentation/components/Button";
import { Input } from "@/presentation/components/input";
import { Text } from "@/presentation/components/Text";
import { useNavigate } from "@tanstack/react-router";
import { UserModel } from "@/core/models/UserModel";
import { useLogin } from "@/core/api/hooks";

export function LandingPage() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [error, setError] = useState<string | null>(null);
    const loginMutation = useLogin();

    const handleEnterGame = async () => {
        if (!username.trim()) {
            return;
        }

        try {
            console.log('Starting login with username:', username.trim());
            setError(null);

            const response = await loginMutation.mutateAsync(username.trim());
            console.log('Login response received:', response);

            // Save user to local model
            const userModel = UserModel.getInstance();
            userModel.setUser(response.user);
            console.log('User saved to model:', response.user);

            // Navigate to lobby
            console.log('Navigating to lobby...');
            await navigate({to: "/lobby"});
        } catch (error) {
            console.error('Login failed:', error);
            setError(error instanceof Error ? error.message : 'Login failed');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && username.trim() && !loginMutation.isPending) {
            handleEnterGame();
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-12 px-4">
            {/* Hero Section */}
            <div className="text-center space-y-6 animate-in fade-in duration-1000">
                <div className="relative">
                    <Text
                        as="h1"
                        size="3xl"
                        weight="bold"
                        className="bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent text-5xl md:text-6xl lg:text-7xl"
                    >
                        JollyTracker
                    </Text>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 opacity-20 blur-2xl"></div>
                </div>

                <Text
                    size="xl"
                    className="text-gray-300 animate-in slide-in-from-bottom-4 duration-1000 delay-300 max-w-2xl"
                >
                    Join friends for epic card game battles. Track scores, manage rounds, and have endless fun!
                </Text>

                <div className="flex justify-center gap-8 mt-8 animate-in slide-in-from-bottom-4 duration-1000 delay-500">
                    <div className="text-center group">
                        <div className="text-3xl font-bold text-white group-hover:text-purple-300 transition-colors">
                            🃏
                        </div>
                        <div className="text-sm text-gray-400 mt-2">Multiple Games</div>
                    </div>
                    <div className="text-center group">
                        <div className="text-3xl font-bold text-white group-hover:text-pink-300 transition-colors">
                            📊
                        </div>
                        <div className="text-sm text-gray-400 mt-2">Score Tracking</div>
                    </div>
                    <div className="text-center group">
                        <div className="text-3xl font-bold text-white group-hover:text-blue-300 transition-colors">
                            👥
                        </div>
                        <div className="text-sm text-gray-400 mt-2">Multiplayer</div>
                    </div>
                </div>
            </div>

            {/* Username Input Section */}
            <div className="w-full max-w-md space-y-6 animate-in slide-in-from-bottom-8 duration-1000 delay-700">
                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-8 shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 hover:scale-105 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10 animate-pulse"></div>

                    <div className="relative z-10 space-y-6">
                        <div className="text-center space-y-2">
                            <Text size="xl" weight="semibold" className="text-white">
                                Welcome!
                            </Text>
                            <div className="w-24 h-1 bg-gradient-to-r from-purple-400 to-blue-400 mx-auto rounded-full"></div>
                        </div>

                        <div className="space-y-4">
                            <div className="relative">
                                <Input
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Enter your username..."
                                    maxLength={20}
                                    className="text-white bg-white/5 border-white/30 focus:border-purple-400 focus:ring-purple-400/50 placeholder-gray-400 transition-all duration-300 hover:bg-white/10 text-center text-lg py-3"
                                    disabled={loginMutation.isPending}
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                            </div>

                            {(loginMutation.isError || error) && (
                                <Text size="sm" className="text-red-400 text-center">
                                    {error || 'Login failed. Please try again.'}
                                </Text>
                            )}

                            <Button
                                colorscheme="purpleToBlue"
                                variant="solid"
                                size="lg"
                                className="w-full text-lg py-4 hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:scale-100"
                                onClick={handleEnterGame}
                                disabled={!username.trim() || loginMutation.isPending}
                            >
                                {loginMutation.isPending ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Entering Game...
                                    </span>
                                ) : (
                                    "Join a Lobby 🚀"
                                )}
                            </Button>
                        </div>

                        {username.trim() && (
                            <div className="text-center animate-in fade-in duration-500">
                                <Text size="sm" className="text-purple-300">
                                    Ready to join as <span className="font-semibold">{username}</span>?
                                </Text>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}