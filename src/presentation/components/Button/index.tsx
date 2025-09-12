import { type ComponentProps, forwardRef } from "react";
import { cn } from "@/utils";
import { cva, type VariantProps } from "class-variance-authority";

// Define colorscheme map with complete class names
const COLORS = {
    primary: {
        solid: "text-white bg-blue-500 hover:bg-blue-600 focus:ring-4 focus:ring-blue-300",
        outline: "border-2 border-blue-500 text-blue-500 hover:bg-blue-300",
        ghost: "text-blue-500 hover:bg-blue-300/80 hover:text-blue-500/90"
    },
    purpleToBlue: {
        solid: "text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 focus:ring-4 focus:ring-purple-300",
        outline: "border-2 border-purple-600 text-purple-600 hover:bg-purple-500",
        ghost: "text-purple-600 hover:bg-purple-500/80 hover:from-purple-700 hover:to-blue-600"
    },
    cyanToBlue: {
        solid: "text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 focus:ring-4 focus:ring-cyan-300",
        outline: "border-2 border-cyan-500 text-cyan-500 hover:bg-cyan-300",
        ghost: "text-cyan-500 hover:bg-cyan-300/80 hover:text-cyan-500/90"
    },
    greenToBlue: {
        solid: "text-white bg-gradient-to-br from-green-400 to-blue-600 hover:from-green-500 hover:to-blue-700 focus:ring-4 focus:ring-green-300",
        outline: "border-2 border-green-400 text-green-400 hover:bg-green-500",
        ghost: "text-green-400 hover:bg-green-500/80 hover:text-green-400/90"
    },
    purpleToPink: {
        solid: "text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 focus:ring-4 focus:ring-purple-300",
        outline: "border-2 border-purple-500 text-purple-500 hover:bg-purple-300",
        ghost: "text-purple-500 hover:bg-purple-300/80 hover:text-purple-500/90"
    },
    pinkToOrange: {
        solid: "text-white bg-gradient-to-br from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 focus:ring-4 focus:ring-pink-300",
        outline: "border-2 border-pink-500 text-pink-500 hover:bg-pink-300",
        ghost: "text-pink-500 hover:bg-pink-300/80 hover:text-pink-500/90"
    },
    tealToLime: {
        solid: "text-white bg-gradient-to-r from-teal-200 to-lime-200 hover:from-teal-300 hover:to-lime-300 focus:ring-4 focus:ring-teal-300",
        outline: "border-2 border-teal-700 text-teal-700 hover:bg-teal-500",
        ghost: "text-teal-700 hover:bg-teal-500/80 hover:text-teal-700/90"
    },
    redToYellow: {
        solid: "text-white bg-gradient-to-r from-red-200 via-red-300 to-yellow-200 hover:from-red-300 hover:via-red-400 hover:to-yellow-300 focus:ring-4 focus:ring-red-300",
        outline: "border-2 border-red-700 text-red-700 hover:bg-red-500",
        ghost: "text-red-700 hover:bg-red-500/80 hover:text-red-700/90"
    },
} as const;

type Colorscheme = keyof typeof COLORS;
const COLOR_KEYS = Object.keys(COLORS) as Colorscheme[];

const buttonStyles = cva(
    "rounded-lg font-semibold focus:outline-none disabled:cursor-not-allowed transition-colors duration-300",
    {
        variants: {
            variant: {
                solid: "",
                outline: "bg-transparent",
                ghost: "bg-transparent",
            },
            size: {
                sm: "px-4 py-2 text-sm",
                md: "px-6 py-2 text-md",
                lg: "px-8 py-3 text-lg",
            },
            colorscheme: COLOR_KEYS.reduce((acc, key) => {
                acc[key] = "";
                return acc;
            }, {} as Record<Colorscheme, string>),
        },
        defaultVariants: {
            size: "md",
            variant: "solid",
            colorscheme: "primary",
        },
    }
);

type ButtonProps = ComponentProps<"button"> &
    VariantProps<typeof buttonStyles> & { colorscheme?: Colorscheme };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = "solid", size = "md", colorscheme = "primary", className, ...props }, ref) => {
        // Ensure we have valid values (fallback to defaults if null/undefined)
        const safeVariant = variant || "solid";
        const safeColorscheme = colorscheme || "primary";

        const colorClasses = COLORS[safeColorscheme][safeVariant];

        return (
            <button
                ref={ref}
                className={cn(buttonStyles({ variant: safeVariant, size }), colorClasses, className)}
                {...props}
            />
        );
    }
);;