// src/presentation/components/SecureAccountModal/index.tsx
import React, {useState} from "react";
import {Button} from "@/presentation/components/Button";
import {Input} from "@/presentation/components/input";
import {Text} from "@/presentation/components/Text";
import {useSecureAccount} from "@/core/api/hooks";
import {useToast} from "@/presentation/components/Toast/useToast";
import {logger} from "@/utils/logger";

// Same limits as the backend (UsersService)
const PASSWORD_MIN_LENGTH = 4;
const PASSWORD_MAX_LENGTH = 72;

interface SecureAccountModalProps {
    isOpen: boolean;
    fullTag: string;
    onClose: () => void;
    onSecured?: () => void;
}

export function SecureAccountModal({isOpen, fullTag, onClose, onSecured}: SecureAccountModalProps) {
    const toast = useToast();
    const secureAccount = useSecureAccount();
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");

    if (!isOpen) return null;

    const close = () => {
        setPassword("");
        setConfirm("");
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
            toast.error(`Password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters`);
            return;
        }
        if (password !== confirm) {
            toast.error("Passwords do not match");
            return;
        }

        try {
            await secureAccount.mutateAsync(password);
            toast.success("Account secured");
            close();
            onSecured?.();
        } catch (error) {
            logger.error("Securing account failed:", error);
            toast.error(error instanceof Error && error.message ? error.message : "Failed to secure account");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
            <form
                onSubmit={handleSubmit}
                className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl border border-purple-500/30 p-8 max-w-md w-full mx-4 shadow-2xl shadow-purple-500/20 space-y-6"
            >
                <div className="text-center space-y-2">
                    <div className="text-5xl mb-4">🔒</div>
                    <Text size="xl" weight="bold" className="text-white">
                        Secure your account
                    </Text>
                    <Text size="sm" className="text-gray-300">
                        Add a password to {fullTag}. You keep your tag and all your games, and can log in with your
                        name and password from any device.
                    </Text>
                </div>

                <div className="space-y-3">
                    <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="text-white bg-white/5 border-white/30 text-center"
                        disabled={secureAccount.isPending}
                    />
                    <Input
                        type="password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="Repeat password"
                        className="text-white bg-white/5 border-white/30 text-center"
                        disabled={secureAccount.isPending}
                    />
                </div>

                <div className="flex gap-3">
                    <Button type="button" variant="ghost" className="flex-1 hover:bg-white/10" onClick={close}
                            disabled={secureAccount.isPending}>
                        Cancel
                    </Button>
                    <Button type="submit" colorscheme="purpleToBlue" variant="solid" className="flex-1"
                            disabled={!password || !confirm || secureAccount.isPending}>
                        {secureAccount.isPending ? "Saving..." : "Set password"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
