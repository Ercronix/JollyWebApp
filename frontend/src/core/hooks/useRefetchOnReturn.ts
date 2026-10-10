import {useEffect, useRef} from "react";

/**
 * Calls refetch when the user comes back to the page (window focus or tab
 * becoming visible), so state missed while away, e.g. dropped live events, is re-synced.
 */
export function useRefetchOnReturn(refetch: () => void) {
    const refetchRef = useRef(refetch);
    useEffect(() => {
        refetchRef.current = refetch;
    }, [refetch]);

    useEffect(() => {
        const handleFocus = () => refetchRef.current();
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                refetchRef.current();
            }
        };

        window.addEventListener("focus", handleFocus);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            window.removeEventListener("focus", handleFocus);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);
}
