export interface ButtonProps {
    /** Is this the principal call to action on the page? */
    primary?: boolean;
    /** What background color to use */
    backgroundColor?: string;
    /** How large should the button be? */
    size?: 'small' | 'medium' | 'large';
    /** Button contents */
    label: string;
    /** Optional click handler */
    onClick?: () => void;
}

/** Primary UI component for user interaction */
export const Button = ({
                           primary = false,
                           size = 'medium',
                           backgroundColor,
                           label,
                           ...props
                       }: ButtonProps) => {
    // Define Tailwind classes based on primary and size props
    const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

    const modeClasses = primary
        ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
        : 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500';

    const sizeClasses =
        size === 'small'
            ? 'px-3 py-1.5 text-sm'
            : size === 'large'
                ? 'px-6 py-3 text-lg'
                : 'px-4 py-2 text-base'; // medium

    return (
        <button
            type="button"
            className={`${baseClasses} ${modeClasses} ${sizeClasses}`}
            style={{ backgroundColor }}
            {...props}
        >
            {label}
        </button>
    );
};