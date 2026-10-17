import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {ToastContext, type ToastApi, type ToastKind} from "./useToast";

const DISMISS_AFTER_MS = 5000;

type ToastItem = {id: number; kind: ToastKind; message: string};

const kindStyles: Record<ToastKind, string> = {
    error: "border-[#e3c2c6] bg-danger-soft text-suit-red",
    success: "border-win/30 bg-win-soft text-win",
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
            <div className="fixed top-[max(1rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-md pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        role={toast.kind === "error" ? "alert" : "status"}
                        className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 font-semibold shadow-[0_10px_24px_rgba(0,0,0,0.4)] ${kindStyles[toast.kind]}`}
                    >
                        <span className="flex-1 text-sm">{toast.message}</span>
                        <button
                            onClick={() => dismiss(toast.id)}
                            aria-label="Dismiss"
                            className="-m-2 w-11 h-11 flex-none flex items-center justify-center text-current opacity-70 hover:opacity-100"
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
