import { type ComponentProps, forwardRef } from "react";
import { cn } from "@/utils";
import { cva, type VariantProps } from "class-variance-authority";

// Accent is the main action; subtle is everything else on the dark surfaces
const COLORS = {
    accent: {
        solid: "text-accent-ink bg-accent hover:bg-[#d8bf8b] focus-visible:ring-4 focus-visible:ring-accent/30",
        outline: "border border-accent text-accent hover:bg-accent-soft",
        ghost: "text-accent hover:bg-accent-soft",
    },
    subtle: {
        solid: "text-fg bg-surface-2 hover:bg-[#2a3832]",
        outline: "border border-line-strong text-fg hover:bg-white/5",
        ghost: "text-fg hover:bg-white/5",
    },
    danger: {
        solid: "text-accent-ink bg-bad hover:bg-[#ec8792] focus-visible:ring-4 focus-visible:ring-bad/30",
        outline: "border border-bad/30 bg-bad-soft text-bad hover:bg-bad/15",
        ghost: "text-bad hover:bg-bad-soft",
    },
} as const;

type Colorscheme = keyof typeof COLORS;
const COLOR_KEYS = Object.keys(COLORS) as Colorscheme[];

const buttonStyles = cva(
    "rounded-[14px] font-bold focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-300",
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
            colorscheme: "accent",
        },
    }
);

type ButtonProps = ComponentProps<"button"> &
    VariantProps<typeof buttonStyles> & { colorscheme?: Colorscheme };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = "solid", size = "md", colorscheme = "accent", className, ...props }, ref) => {
        // Ensure we have valid values (fallback to defaults if null/undefined)
        const safeVariant = variant || "solid";
        const safeColorscheme = colorscheme || "accent";

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