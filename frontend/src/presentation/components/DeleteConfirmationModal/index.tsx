// src/presentation/components/DeleteConfirmationModal.tsx
import { Button } from "@/presentation/components/Button";
import { Text } from "@/presentation/components/Text";

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    itemName?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDeleting?: boolean;
}

export function DeleteConfirmationModal({
                                            isOpen,
                                            title,
                                            message,
                                            itemName,
                                            onConfirm,
                                            onCancel,
                                            isDeleting = false,
                                        }: DeleteConfirmationModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl border border-red-500/30 p-8 max-w-md w-full mx-4 shadow-2xl shadow-red-500/20 animate-in zoom-in-95 duration-300">
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="text-5xl mb-4">⚠️</div>
                        <Text size="xl" weight="bold" className="text-white mb-2">
                            {title}
                        </Text>
                        <Text size="sm" className="text-gray-300">
                            {message}{" "}
                            {itemName && (
                                <span className="text-red-400 font-semibold">
                                    {itemName}
                                </span>
                            )}
                            ?
                        </Text>
                        <Text size="sm" className="text-gray-400 mt-2">
                            This action cannot be undone.
                        </Text>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="ghost"
                            className="flex-1 hover:bg-white/10"
                            onClick={onCancel}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            colorscheme="pinkToOrange"
                            variant="solid"
                            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                            onClick={onConfirm}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}