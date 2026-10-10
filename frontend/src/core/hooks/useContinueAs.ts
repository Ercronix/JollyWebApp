import {useCallback, useState} from "react";
import {useLogin} from "@/core/api/hooks";
import {ApiError} from "@/core/api/client";
import {UserModel} from "@/core/models/UserModel";

export type ContinueAsOutcome = 'ok' | 'needs-password' | 'not-found';

/**
 * Logs back into the account this device used last, by its tag
 */
export function useContinueAs() {
    const {mutateAsync: login, isPending} = useLogin();
    const [lastTag, setLastTag] = useState(() => UserModel.getInstance().getLastFullTag());

    const continueAs = useCallback(async (): Promise<ContinueAsOutcome> => {
        if (!lastTag) return 'not-found';

        try {
            const response = await login({username: lastTag});
            UserModel.getInstance().setUser(response.user);
            return 'ok';
        } catch (error) {
            if (error instanceof ApiError && error.status === 403) return 'needs-password';
            if (error instanceof ApiError && error.status === 404) {
                UserModel.getInstance().forgetLastFullTag();
                setLastTag(null);
                return 'not-found';
            }
            throw error;
        }
    }, [lastTag, login]);

    return {lastTag, continueAs, isPending};
}
