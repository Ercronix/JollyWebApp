import {useCallback, useState} from "react";

/**
 * A boolean that survives page reloads, stored in localStorage under `key`.
 * Falls back to in-memory state when storage is unavailable.
 */
export function useStoredFlag(key: string, defaultValue = false): [boolean, (value: boolean) => void] {
    const [value, setValueState] = useState(() => {
        try {
            const stored = localStorage.getItem(key);
            return stored === null ? defaultValue : stored === 'true';
        } catch {
            return defaultValue;
        }
    });

    const setValue = useCallback((next: boolean) => {
        setValueState(next);
        try {
            localStorage.setItem(key, String(next));
        } catch {
            // storage unavailable, keep in-memory value only
        }
    }, [key]);

    return [value, setValue];
}
