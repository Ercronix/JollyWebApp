// Password rules; keep in sync with backend/service/UsersService.js
export const PASSWORD_MIN_LENGTH = 4;
export const PASSWORD_MAX_LENGTH = 72; // bcrypt ignores everything beyond 72 bytes

/**
 * Returns an error message, or null if the password is acceptable
 */
export function validatePassword(password: string): string | null {
    if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
        return `Password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters`;
    }
    return null;
}
