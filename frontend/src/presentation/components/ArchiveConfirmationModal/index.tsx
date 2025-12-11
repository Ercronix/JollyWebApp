// src/presentation/components/DeleteConfirmationModal.tsx
import { Button } from "@/presentation/components/Button";
import { Text } from "@/presentation/components/Text";

interface ArchiveConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    itemName?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isArchiving?: boolean;
}

export function ArchiveConfirmationModal({
                                            isOpen,
                                            title,
                                            message,
                                            itemName,
                                            onConfirm,
                                            onCancel,
                                            isArchiving = false,
                                        }: ArchiveConfirmationModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl border border-red-200/30 p-8 max-w-md w-full mx-4 shadow-2xl shadow-red-500/20 animate-in zoom-in-95 duration-300">
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="text-5xl mb-4">🗄️</div>
                        <div>
                        <Text size="xl" weight="bold" className="text-white mb-2">
                            {title}
                        </Text>
                        </div>
                        <Text size="sm" className="text-gray-300">
                            {message}{" "}
                            {itemName && (
                                <span className="text-red-200 font-semibold">
                                    {itemName}
                                </span>
                            )}
                            ?
                        </Text>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="ghost"
                            className="flex-1 hover:bg-white/10"
                            onClick={onCancel}
                            disabled={isArchiving}
                        >
                            Cancel
                        </Button>
                        <Button
                            colorscheme="pinkToOrange"
                            variant="solid"
                            className="flex-1 bg-gradient-to-r from-red-200 to-red-300 hover:from-red-100 hover:to-red-200"
                            onClick={onConfirm}
                            disabled={isArchiving}
                        >
                            {isArchiving ? "Archiving..." : "Archive"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}