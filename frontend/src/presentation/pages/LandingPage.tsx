// src/presentation/pages/LandingPage.tsx
import React, {useState} from "react";
import {Button} from "@/presentation/components/Button";
import {Input} from "@/presentation/components/input";
import {Text} from "@/presentation/components/Text";
import {useNavigate} from "@tanstack/react-router";
import {UserModel} from "@/core/models/UserModel";
import {useLogin, useRegister} from "@/core/api/hooks";

type AuthMode = 'quick' | 'login' | 'register';

export function LandingPage() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [authMode, setAuthMode] = useState<AuthMode>('quick');
    const [error, setError] = useState<string | null>(null);
    const loginMutation = useLogin();
    const registerMutation = useRegister();

    const handleQuickJoin = async () => {
        if (!username.trim()) return;

        try {
            console.log('Quick join with username:', username.trim());
            setError(null);

            const response = await loginMutation.mutateAsync({username: username.trim()});
            console.log('Login response:', response);

            const userModel = UserModel.getInstance();
            userModel.setUser(response.user);

            if (response.isNewAccount) {
                console.log('New account created with tag:', response.user.fullTag);
            }

            const pendingCode = localStorage.getItem('pendingJoinCode');
            if (pendingCode) {
                console.log('Found pending join code, redirecting to join:', pendingCode);
                localStorage.removeItem('pendingJoinCode');

                await navigate({ to: `/join/${pendingCode}` });
                return;
            }

            await navigate({to: "/lobby"});
        } catch (error) {
            console.error('Quick join failed:', error);
            setError(error instanceof Error ? error.message : 'Login failed');
        }
    };

    const handleLogin = async () => {
        if (!username.trim()) return;

        try {
            console.log('Login with username:', username.trim());
            setError(null);

            const response = await loginMutation.mutateAsync({
                username: username.trim(),
                password: password || undefined
            });
            console.log('Login response:', response);

            const userModel = UserModel.getInstance();
            userModel.setUser(response.user);

            const pendingCode = localStorage.getItem('pendingJoinCode');
            if (pendingCode) {
                console.log('Found pending join code, redirecting to join:', pendingCode);
                localStorage.removeItem('pendingJoinCode');

                await navigate({ to: `/join/${pendingCode}` });
                return;
            }

            await navigate({to: "/lobby"});
        } catch (error) {
            console.error('Login failed:', error);
            setError(error instanceof Error ? error.message : 'Login failed');
        }
    };

    const handleRegister = async () => {
        if (!username.trim() || !password.trim()) {
            setError('Username and password are required');
            return;
        }

        try {
            console.log('Registering with username:', username.trim());
            setError(null);

            const response = await registerMutation.mutateAsync({
                username: username.trim(),
                password: password
            });
            console.log('Register response:', response);

            const userModel = UserModel.getInstance();
            userModel.setUser(response.user);

            const pendingCode = localStorage.getItem('pendingJoinCode');
            if (pendingCode) {
                console.log('Pending join code found:', pendingCode);
                localStorage.removeItem('pendingJoinCode');
                await navigate({ to: `/join/${pendingCode}` });
                return;
            }

            await navigate({to: "/lobby"});
        } catch (error) {
            console.error('Registration failed:', error);
            setError(error instanceof Error ? error.message : 'Registration failed');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && username.trim()) {
            if (authMode === 'quick' && !loginMutation.isPending) {
                void handleQuickJoin();
            } else if (authMode === 'login' && !loginMutation.isPending) {
                void handleLogin();
            } else if (authMode === 'register' && password.trim() && !registerMutation.isPending) {
                void handleRegister();
            }
        }
    };

    const isPending = loginMutation.isPending || registerMutation.isPending;

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
                    <div
                        className="absolute inset-0 bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 opacity-20 blur-2xl"></div>
                </div>

                <Text
                    size="xl"
                    className="text-gray-300 animate-in slide-in-from-bottom-4 duration-1000 delay-300 max-w-2xl"
                >
                    Join friends for epic card game battles. Track scores, manage rounds, and have endless fun!
                </Text>

                <div
                    className="flex justify-center gap-8 mt-8 animate-in slide-in-from-bottom-4 duration-1000 delay-500">
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

            {/* Auth Section */}
            <div className="w-full max-w-md space-y-6 animate-in slide-in-from-bottom-8 duration-1000 delay-700">
                <div
                    className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-4 shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 hover:scale-105 relative overflow-hidden">
                    <div
                        className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10 animate-pulse"></div>

                    <div className="relative z-10 space-y-6">
                        {/* Mode Selector */}
                        <div className="flex gap-2 bg-white/5 rounded-xl p-2">
                            <button
                                onClick={() => setAuthMode('quick')}
                                className={`flex-1 py-2 px-4 rounded-lg transition-all duration-300 ${
                                    authMode === 'quick'
                                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                Quick Join
                            </button>
                            <button
                                onClick={() => setAuthMode('login')}
                                className={`flex-1 py-2 px-4 rounded-lg transition-all duration-300 ${
                                    authMode === 'login'
                                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                Login
                            </button>
                            <button
                                onClick={() => setAuthMode('register')}
                                className={`flex-1 py-2 px-4 rounded-lg transition-all duration-300 ${
                                    authMode === 'register'
                                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                Register
                            </button>
                        </div>

                        {/* Title */}
                        <div className="text-center space-y-2">
                            <Text size="xl" weight="semibold" className="text-white">
                                {authMode === 'quick' && 'Quick Join'}
                                {authMode === 'login' && 'Welcome Back!'}
                                {authMode === 'register' && 'Create Protected Account'}
                            </Text>
                            <div>
                                <Text size="sm" className="text-gray-400">
                                    {authMode === 'quick' && 'Enter a name and start playing instantly'}
                                    {authMode === 'login' && 'Login with your tag (e.g., User#4523) or protected username (No tag needed with password)'}
                                    {authMode === 'register' && 'Claim your username with a password'}
                                </Text>
                            </div>
                            <div
                                className="w-24 h-1 bg-gradient-to-r from-purple-400 to-blue-400 mx-auto rounded-full"></div>
                        </div>

                        {/* Form */}
                        <div className="space-y-4">
                            <div className="relative">
                                <Input
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    placeholder={
                                        authMode === 'quick'
                                            ? 'Enter your name...'
                                            : authMode === 'login'
                                                ? 'Username or Tag (e.g., Tim#4523)...'
                                                : 'Choose your username...'
                                    }
                                    maxLength={20}
                                    className="text-white bg-white/5 border-white/30 focus:border-purple-400 focus:ring-purple-400/50 placeholder-gray-400 transition-all duration-300 hover:bg-white/10 text-center text-lg py-3"
                                    disabled={isPending}
                                />
                            </div>

                            {(authMode === 'login' || authMode === 'register') && (
                                <div className="relative">
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onKeyDown={handleKeyPress}
                                        placeholder={authMode === 'register' ? 'Create a password...' : 'Password (optional for tags)...'}
                                        className="text-white bg-white/5 border-white/30 focus:border-purple-400 focus:ring-purple-400/50 placeholder-gray-400 transition-all duration-300 hover:bg-white/10 text-center text-lg py-3"
                                        disabled={isPending}
                                    />
                                </div>
                            )}

                            {error && (
                                <Text size="sm" className="text-red-400 text-center">
                                    {error}
                                </Text>
                            )}

                            <Button
                                colorscheme="purpleToBlue"
                                variant="solid"
                                size="lg"
                                className="w-full text-lg py-4 hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:scale-100"
                                onClick={
                                    authMode === 'quick'
                                        ? handleQuickJoin
                                        : authMode === 'login'
                                            ? handleLogin
                                            : handleRegister
                                }
                                disabled={
                                    !username.trim() ||
                                    isPending ||
                                    (authMode === 'register' && !password.trim())
                                }
                            >
                                {isPending ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div
                                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        {authMode === 'register' ? 'Creating Account...' : 'Joining...'}
                                    </span>
                                ) : (
                                    <>
                                        {authMode === 'quick' && 'Join Now'}
                                        {authMode === 'login' && 'Login'}
                                        {authMode === 'register' && 'Create Account'}
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Info Text */}
                        {username.trim() && (
                            <div className="text-center animate-in fade-in duration-500">
                                <Text size="sm" className="text-purple-300">
                                    {authMode === 'quick' && `You'll be assigned a unique tag like ${username}#1234`}
                                    {authMode === 'register' && `Claiming "${username}" - others won't be able to use it`}
                                </Text>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}