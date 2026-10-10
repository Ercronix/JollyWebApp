import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {ToastContext, type ToastApi, type ToastKind} from "./useToast";

const DISMISS_AFTER_MS = 5000;

type ToastItem = {id: number; kind: ToastKind; message: string};

const kindStyles: Record<ToastKind, string> = {
    error: "border-red-500/40 bg-red-950/80 text-red-100",
    success: "border-green-500/40 bg-green-950/80 text-green-100",
};

export const ToastProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const nextId = useRef(0);
    const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

    const dismiss = useCallback((id: number) => {
        clearTimeout(timers.current.get(id));
        timers.current.delete(id);
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const show = useCallback((kind: ToastKind, message: string) => {
        const id = nextId.current++;
        setToasts(prev => [...prev, {id, kind, message}]);
        timers.current.set(id, setTimeout(() => dismiss(id), DISMISS_AFTER_MS));
    }, [dismiss]);

    useEffect(() => {
        const pending = timers.current;
        return () => pending.forEach(clearTimeout);
    }, []);

    const api = useMemo<ToastApi>(() => ({
        error: (message) => show("error", message),
        success: (message) => show("success", message),
    }), [show]);

    return (
        <ToastContext.Provider value={api}>
            {children}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-md pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        role={toast.kind === "error" ? "alert" : "status"}
                        className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-xl ${kindStyles[toast.kind]}`}
                    >
                        <span className="flex-1 text-sm">{toast.message}</span>
                        <button
                            onClick={() => dismiss(toast.id)}
                            aria-label="Dismiss"
                            className="text-current opacity-70 hover:opacity-100"
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
