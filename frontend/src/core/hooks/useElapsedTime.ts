import {useEffect, useState} from "react";

/**
 * Milliseconds from start to end, or to now (updated every second) while there's no end yet
 */
export function useElapsedTime(start: string | undefined, end?: string | null): number | null {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!start || end) return;
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [start, end]);

    if (!start) return null;
    return (end ? new Date(end).getTime() : now) - new Date(start).getTime();
}
