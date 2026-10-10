import {useCallback, useState} from "react";

/**
 * Logging out of an account without a password risks losing it (only its tag gets
 * the user back in), so those accounts get a warning first.
 */
export function useLogoutFlow(user: {hasPassword?: boolean} | null, logout: () => Promise<void>) {
    const [showWarning, setShowWarning] = useState(false);

    const requestLogout = useCallback(() => {
        if (user?.hasPassword) {
            void logout();
        } else {
            setShowWarning(true);
        }
    }, [user?.hasPassword, logout]);

    const confirmLogout = useCallback(async () => {
        setShowWarning(false);
        await logout();
    }, [logout]);

    const cancel = useCallback(() => setShowWarning(false), []);

    return {requestLogout, showWarning, confirmLogout, cancel};
}
