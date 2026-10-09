import {createContext, useContext} from "react";

export type ToastKind = "error" | "success";

export type ToastApi = {
    error: (message: string) => void;
    success: (message: string) => void;
};

export const ToastContext = createContext<ToastApi | null>(null);

/**
 * Non-blocking notifications; use instead of alert(). Requires <ToastProvider> (mounted in App.tsx).
 */
export function useToast(): ToastApi {
    const toast = useContext(ToastContext);
    if (!toast) {
        throw new Error("useToast must be used inside <ToastProvider>");
    }
    return toast;
}
