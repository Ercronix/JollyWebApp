// src/presentation/components/DeleteConfirmationModal.tsx
import { Button } from "@/presentation/components/Button";
import { Text } from "@/presentation/components/Text";
import { Sheet } from "@/presentation/components/Sheet";

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    itemName?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDeleting?: boolean;
    confirmLabel?: string;
    confirmingLabel?: string;
    // An alternative to confirming, e.g. "Set password" instead of logging out
    extraAction?: { label: string; onClick: () => void };
}

export function DeleteConfirmationModal({
                                            isOpen,
                                            title,
                                            message,
                                            itemName,
                                            onConfirm,
                                            onCancel,
                                            isDeleting = false,
                                            confirmLabel = "Delete",
                                            confirmingLabel = "Deleting...",
                                            extraAction,
                                        }: DeleteConfirmationModalProps) {
    return (
        <Sheet
            isOpen={isOpen}
            onClose={isDeleting ? () => {} : onCancel}
            title={title}
            footer={
                <div className="flex flex-col gap-2">
                    {extraAction && (
                        <Button
                            colorscheme="accent"
                            variant="solid"
                            className="w-full min-h-12"
                            onClick={extraAction.onClick}
                            disabled={isDeleting}
                        >
                            {extraAction.label}
                        </Button>
                    )}
                    <div className="flex gap-2">
                        <Button
                            colorscheme="subtle"
                            variant="ghost"
                            className="flex-1 min-h-12"
                            onClick={onCancel}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            colorscheme="danger"
                            variant="solid"
                            className="flex-1 min-h-12"
                            onClick={onConfirm}
                            disabled={isDeleting}
                        >
                            {isDeleting ? confirmingLabel : confirmLabel}
                        </Button>
                    </div>
                </div>
            }
        >
            <Text size="sm" className="text-fg-muted px-1">
                {message}{" "}
                {itemName && (
                    <span className="text-bad font-semibold break-words">
                        {itemName}
                    </span>
                )}
                ?
            </Text>
        </Sheet>
    );
}
