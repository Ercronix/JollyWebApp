// src/presentation/pages/LandingPage.tsx
import React, {useState} from "react";
import {Button} from "@/presentation/components/Button";
import {Input} from "@/presentation/components/input";
import {Text} from "@/presentation/components/Text";
import {useNavigate} from "@tanstack/react-router";
import {UserModel} from "@/core/models/UserModel";
import {useLogin, useRegister} from "@/core/api/hooks";
import {useContinueAs} from "@/core/hooks/useContinueAs";
import type {User} from "@/types";
import {logger} from "@/utils/logger";

type AuthMode = 'quick' | 'login' | 'register';

export function LandingPage() {
    const navigate = useNavigate();
    // Pre-fill the tag of an expired session so the user gets back into the same account
    const [username, setUsername] = useState(() => UserModel.getInstance().getLastFullTag() ?? "");
    const [password, setPassword] = useState("");
    const [authMode, setAuthMode] = useState<AuthMode>('quick');
    const [error, setError] = useState<string | null>(null);
    const loginMutation = useLogin();
    const registerMutation = useRegister();
    const {lastTag, continueAs, isPending: isContinuing} = useContinueAs();

    // After any successful login: resume a pending invite link, else go to the lobbies
    const finishLogin = async (user: User) => {
        UserModel.getInstance().setUser(user);

        const pendingCode = localStorage.getItem('pendingJoinCode');
        if (pendingCode) {
            logger.debug('Found pending join code, redirecting to join:', pendingCode);
            localStorage.removeItem('pendingJoinCode');
            await navigate({ to: `/join/${pendingCode}` });
            return;
        }

        await navigate({to: "/lobby"});
    };

    const handleContinueAs = async () => {
        if (!lastTag) return;
        try {
            setError(null);
            const outcome = await continueAs();
            if (outcome === 'ok') {
                await finishLogin(UserModel.getInstance().getCurrentUser()!);
            } else if (outcome === 'needs-password') {
                setAuthMode('login');
                setUsername(lastTag.split('#')[0]);
                setError('This account has a password. Log in with your name and password.');
            } else {
                setError(`The account ${lastTag} no longer exists.`);
            }
        } catch (error) {
            logger.error('Continue as failed:', error);
            setError(error instanceof Error ? error.message : 'Login failed');
        }
    };

    const handleQuickJoin = async () => {
        if (!username.trim()) return;

        try {
            logger.debug('Quick join with username:', username.trim());
            setError(null);

            const response = await loginMutation.mutateAsync({username: username.trim()});
            logger.debug('Login response:', response);

            if (response.isNewAccount) {
                logger.debug('New account created with tag:', response.user.fullTag);
            }

            await finishLogin(response.user);
        } catch (error) {
            logger.error('Quick join failed:', error);
            setError(error instanceof Error ? error.message : 'Login failed');
        }
    };

    const handleLogin = async () => {
        if (!username.trim()) return;

        try {
            logger.debug('Login with username:', username.trim());
            setError(null);

            const response = await loginMutation.mutateAsync({
                username: username.trim(),
                password: password || undefined
            });
            logger.debug('Login response:', response);

            await finishLogin(response.user);
        } catch (error) {
            logger.error('Login failed:', error);
            setError(error instanceof Error ? error.message : 'Login failed');
        }
    };

    const handleRegister = async () => {
        if (!username.trim() || !password.trim()) {
            setError('Username and password are required');
            return;
        }

        try {
            logger.debug('Registering with username:', username.trim());
            setError(null);

            const response = await registerMutation.mutateAsync({
                username: username.trim(),
                password: password
            });
            logger.debug('Register response:', response);

            await finishLogin(response.user);
        } catch (error) {
            logger.error('Registration failed:', error);
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

    const isPending = loginMutation.isPending || registerMutation.isPending || isContinuing;

    return (
        <div className="min-h-[calc(100dvh-6rem)] flex flex-col items-center justify-center gap-6 sm:gap-12 py-4">
            {/* Hero Section */}
            <div className="text-center flex flex-col items-center gap-3 sm:gap-6">
                {/* A small fan of cards, one per suit */}
                <div aria-hidden="true" className="relative w-[200px] h-[112px]">
                    {[
                        {symbol: "♠", red: false, left: 30, top: 14, rotate: "-rotate-[18deg]"},
                        {symbol: "♥", red: true, left: 62, top: 4, rotate: "-rotate-6"},
                        {symbol: "♦", red: true, left: 94, top: 4, rotate: "rotate-6"},
                        {symbol: "♣", red: false, left: 126, top: 14, rotate: "rotate-[18deg]"},
                    ].map(card => (
                        <div
                            key={card.symbol}
                            className={`absolute w-16 h-[90px] rounded-[10px] bg-card shadow-[0_6px_14px_rgba(0,0,0,0.35)] flex items-center justify-center text-[30px] ${card.rotate} ${card.red ? "text-suit-red" : "text-ink"}`}
                            style={{left: card.left, top: card.top}}
                        >
                            {card.symbol}
                        </div>
                    ))}
                </div>

                <Text
                    as="h1"
                    className="font-display font-extrabold tracking-tight text-on-felt text-[42px] leading-none sm:text-6xl lg:text-7xl"
                >
                    JollyTracker
                </Text>

                <Text
                    size="xl"
                    className="text-[#d6e2da] text-base sm:text-xl max-w-[320px] sm:max-w-2xl leading-relaxed"
                >
                    Join friends for epic card game battles. Track scores, manage rounds, and have endless fun!
                </Text>

                <div
                    className="hidden sm:flex justify-center gap-8 mt-4">
                    <div className="text-center">
                        <div className="text-3xl text-on-felt" aria-hidden="true">♠</div>
                        <div className="text-sm text-on-felt-muted mt-2">Multiple Games</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl text-[#ff8c7a]" aria-hidden="true">♥</div>
                        <div className="text-sm text-on-felt-muted mt-2">Score Tracking</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl text-gold" aria-hidden="true">♦</div>
                        <div className="text-sm text-on-felt-muted mt-2">Multiplayer</div>
                    </div>
                </div>
            </div>

            {/* Auth Section */}
            <div className="w-full max-w-md space-y-6">
                <div
                    className="rounded-[22px] bg-card text-ink p-4 shadow-[0_12px_30px_rgba(0,0,0,0.4)]">
                    <div className="space-y-5">
                        {lastTag && (
                            <Button
                                colorscheme="ink"
                                variant="outline"
                                size="lg"
                                className="w-full min-h-[52px] border-2 border-felt text-felt font-extrabold"
                                onClick={handleContinueAs}
                                disabled={isPending}
                            >
                                Continue as {lastTag}
                            </Button>
                        )}

                        {/* Mode Selector */}
                        <div className="flex gap-1 bg-card-muted rounded-[14px] p-1">
                            <button
                                onClick={() => setAuthMode('quick')}
                                className={`flex-1 min-h-11 px-2 rounded-[10px] text-[15px] font-bold transition-colors duration-300 ${
                                    authMode === 'quick'
                                        ? 'bg-felt text-card'
                                        : 'text-ink-muted hover:text-ink'
                                }`}
                            >
                                Quick Join
                            </button>
                            <button
                                onClick={() => setAuthMode('login')}
                                className={`flex-1 min-h-11 px-2 rounded-[10px] text-[15px] font-bold transition-colors duration-300 ${
                                    authMode === 'login'
                                        ? 'bg-felt text-card'
                                        : 'text-ink-muted hover:text-ink'
                                }`}
                            >
                                Login
                            </button>
                            <button
                                onClick={() => setAuthMode('register')}
                                className={`flex-1 min-h-11 px-2 rounded-[10px] text-[15px] font-bold transition-colors duration-300 ${
                                    authMode === 'register'
                                        ? 'bg-felt text-card'
                                        : 'text-ink-muted hover:text-ink'
                                }`}
                            >
                                Register
                            </button>
                        </div>

                        {/* Title */}
                        <div className="text-center space-y-2">
                            <Text size="xl" className="font-display font-extrabold text-ink">
                                {authMode === 'quick' && 'Quick Join'}
                                {authMode === 'login' && 'Welcome Back!'}
                                {authMode === 'register' && 'Create Protected Account'}
                            </Text>
                            <div>
                                <Text size="sm" className="text-ink-muted leading-relaxed">
                                    {authMode === 'quick' && "You'll get a tag like Tim#1234. Remember it, because it's how you get back to your private games. You can add a password later."}
                                    {authMode === 'login' && 'Log in with your name and password, or with your tag (e.g. Tim#4523) if you have no password'}
                                    {authMode === 'register' && 'Protect your account with a password, so you can always get back to your games'}
                                </Text>
                            </div>
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
                                    maxLength={authMode === 'register' ? 20 : 25}
                                    aria-label={authMode === 'login' ? 'Username or tag' : 'Your name'}
                                    autoComplete={authMode === 'quick' ? 'nickname' : 'username'}
                                    autoCapitalize="words"
                                    autoCorrect="off"
                                    spellCheck={false}
                                    enterKeyHint="go"
                                    className="h-[52px] text-center text-lg"
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
                                        aria-label="Password"
                                        autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                                        enterKeyHint="go"
                                        className="h-[52px] text-center text-lg"
                                        disabled={isPending}
                                    />
                                </div>
                            )}

                            {error && (
                                <Text size="sm" className="text-suit-red font-semibold text-center">
                                    {error}
                                </Text>
                            )}

                            <Button
                                colorscheme="gold"
                                variant="solid"
                                size="lg"
                                className="w-full min-h-14 rounded-full font-display text-[19px] font-extrabold"
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
                                            className="w-5 h-5 border-2 border-ink/30 border-t-ink rounded-full animate-spin"></div>
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
                            <div className="text-center">
                                <Text size="sm" className="text-gold-ink">
                                    {authMode === 'quick' && `You'll be assigned a unique tag like ${username}#1234`}
                                    {authMode === 'register' && `You'll log in with "${username}" and your password`}
                                </Text>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}