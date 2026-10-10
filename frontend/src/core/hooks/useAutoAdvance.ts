import {useEffect, useRef} from "react";

type Options = {
    enabled: boolean;
    /** True once every player has submitted for the round */
    ready: boolean;
    onAdvance: () => void;
    delayMs?: number;
};

/**
 * Calls onAdvance once `ready` has stayed true for delayMs while enabled.
 * The pending call is cancelled if the round stops being ready (e.g. a reset).
 */
export function useAutoAdvance({enabled, ready, onAdvance, delayMs = 1500}: Options) {
    // Read the latest callback without restarting the timer when its identity changes
    const onAdvanceRef = useRef(onAdvance);
    useEffect(() => {
        onAdvanceRef.current = onAdvance;
    }, [onAdvance]);

    useEffect(() => {
        if (!enabled || !ready) return;
        const timer = setTimeout(() => onAdvanceRef.current(), delayMs);
        return () => clearTimeout(timer);
    }, [enabled, ready, delayMs]);
}
