// src/presentation/components/SecureAccountModal/index.tsx
import React, {useState} from "react";
import {Button} from "@/presentation/components/Button";
import {Input} from "@/presentation/components/input";
import {Text} from "@/presentation/components/Text";
import {Sheet} from "@/presentation/components/Sheet";
import {useSecureAccount} from "@/core/api/hooks";
import {useToast} from "@/presentation/components/Toast/useToast";
import {logger} from "@/utils/logger";
import {validatePassword} from "@/core/passwords";

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
        const passwordError = validatePassword(password);
        if (passwordError) {
            toast.error(passwordError);
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
        <Sheet isOpen onClose={secureAccount.isPending ? () => {} : close} title="Secure your account">
            <form onSubmit={handleSubmit} className="space-y-5 px-1">
                <div>
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
                        autoComplete="new-password"
                        aria-label="Password"
                        className="h-12 text-white bg-white/5 border-white/30 text-center"
                        disabled={secureAccount.isPending}
                    />
                    <Input
                        type="password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="Repeat password"
                        autoComplete="new-password"
                        aria-label="Repeat password"
                        className="h-12 text-white bg-white/5 border-white/30 text-center"
                        disabled={secureAccount.isPending}
                    />
                </div>

                <div className="flex gap-3">
                    <Button type="button" variant="ghost" className="flex-1 min-h-12 text-slate-200 hover:bg-white/10" onClick={close}
                            disabled={secureAccount.isPending}>
                        Cancel
                    </Button>
                    <Button type="submit" colorscheme="purpleToBlue" variant="solid" className="flex-1 min-h-12"
                            disabled={!password || !confirm || secureAccount.isPending}>
                        {secureAccount.isPending ? "Saving..." : "Set password"}
                    </Button>
                </div>
            </form>
        </Sheet>
    );
}
