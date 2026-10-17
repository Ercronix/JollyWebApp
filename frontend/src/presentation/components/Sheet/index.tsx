import {type ReactNode, useEffect, useId} from "react";
import {cn} from "@/utils";

type SheetProps = {
    isOpen: boolean;
    onClose: () => void;
    title: ReactNode;
    // Shown under the title, e.g. a player's total
    subtitle?: ReactNode;
    children: ReactNode;
    // Pinned below the scrolling content, e.g. the confirm buttons
    footer?: ReactNode;
    className?: string;
};

/**
 * A dialog that slides up from the bottom on phones (within thumb reach) and is centered on larger screens
 */
export function Sheet({isOpen, onClose, title, subtitle, children, footer, className}: SheetProps) {
    const titleId = useId();

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKeyDown);
        // Keep the page behind the sheet from scrolling
        const overflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = overflow;
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
            <div
                data-testid="sheet-backdrop"
                className="absolute inset-0 bg-[rgba(5,8,7,0.7)] backdrop-blur-sm"
                onClick={onClose}
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className={cn(
                    "relative w-full sm:max-w-md max-h-[90dvh] flex flex-col bg-[#141e19] text-fg",
                    "rounded-t-3xl sm:rounded-3xl border-t sm:border border-white/[0.08] shadow-[0_-16px_40px_rgba(0,0,0,0.5)]",
                    "animate-sheet-up",
                    className,
                )}
            >
                <div className="flex justify-center pt-2 sm:hidden" aria-hidden="true">
                    <div className="w-10 h-1 rounded-full bg-white/[0.18]"/>
                </div>
                <div className="flex items-start gap-3 pl-5 pr-2 pt-3 pb-2">
                    <div className="flex-1 min-w-0">
                        <h2 id={titleId} className="text-[21px] font-extrabold tracking-tight break-words">{title}</h2>
                        {subtitle && <div className="text-sm text-fg-muted mt-0.5">{subtitle}</div>}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="flex-none w-11 h-11 rounded-full bg-white/[0.06] hover:bg-white/10 flex items-center justify-center"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                            <path d="M6 6l12 12M18 6L6 18"/>
                        </svg>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
                    {children}
                </div>
                {footer && (
                    <div className="px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-line">
                        {footer}
                    </div>
                )}
                {!footer && <div className="pb-[env(safe-area-inset-bottom)]"/>}
            </div>
        </div>
    );
}
