type Logger = {
    debug: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
};

export function createLogger(debugEnabled: boolean): Logger {
    return {
        debug: debugEnabled ? (...args) => console.log(...args) : () => {},
        warn: (...args) => console.warn(...args),
        error: (...args) => console.error(...args),
    };
}

/**
 * App logger: debug output only in development builds, warnings and errors always
 */
export const logger = createLogger(import.meta.env.DEV);
