// src/presentation/components/ArchiveConfirmationModal.tsx
import { Button } from "@/presentation/components/Button";
import { Text } from "@/presentation/components/Text";
import { Sheet } from "@/presentation/components/Sheet";

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
    return (
        <Sheet
            isOpen={isOpen}
            onClose={isArchiving ? () => {} : onCancel}
            title={title}
            footer={
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        className="flex-1 min-h-12 text-slate-200 hover:bg-white/10"
                        onClick={onCancel}
                        disabled={isArchiving}
                    >
                        Cancel
                    </Button>
                    <Button
                        colorscheme="purpleToBlue"
                        variant="solid"
                        className="flex-1 min-h-12"
                        onClick={onConfirm}
                        disabled={isArchiving}
                    >
                        {isArchiving ? "Archiving..." : "Archive"}
                    </Button>
                </div>
            }
        >
            <Text size="sm" className="text-slate-300 px-1">
                {message}{" "}
                {itemName && <span className="text-white font-semibold break-words">{itemName}</span>}
                ?
            </Text>
        </Sheet>
    );
}
