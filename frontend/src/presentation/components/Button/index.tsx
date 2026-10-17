import { type ComponentProps, forwardRef } from "react";
import { cn } from "@/utils";
import { cva, type VariantProps } from "class-variance-authority";

// Card table colorschemes: gold is the main action, felt sits on the green background,
// ink sits on cream cards and sheets
const COLORS = {
    gold: {
        solid: "text-ink bg-gold hover:bg-[#f5c262] shadow-[0_3px_0_var(--color-gold-dark)] focus-visible:ring-4 focus-visible:ring-gold/40",
        outline: "border-2 border-gold text-gold hover:bg-gold/10",
        ghost: "text-gold hover:bg-gold/10",
    },
    felt: {
        solid: "text-on-felt bg-on-felt/10 hover:bg-on-felt/15",
        outline: "border-2 border-on-felt/40 text-on-felt hover:bg-on-felt/10",
        ghost: "text-on-felt hover:bg-on-felt/10",
    },
    ink: {
        solid: "text-card bg-felt hover:bg-felt-light",
        outline: "border border-card-line text-ink hover:bg-card-muted",
        ghost: "text-ink hover:bg-card-muted",
    },
    danger: {
        solid: "text-white bg-suit-red hover:bg-[#9a1026] focus-visible:ring-4 focus-visible:ring-suit-red/30",
        outline: "border border-[#e3c2c6] bg-danger-soft text-suit-red hover:bg-[#f7dfe3]",
        ghost: "text-suit-red hover:bg-danger-soft",
    },
} as const;

type Colorscheme = keyof typeof COLORS;
const COLOR_KEYS = Object.keys(COLORS) as Colorscheme[];

const buttonStyles = cva(
    "rounded-xl font-bold focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-300",
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
            colorscheme: "gold",
        },
    }
);

type ButtonProps = ComponentProps<"button"> &
    VariantProps<typeof buttonStyles> & { colorscheme?: Colorscheme };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = "solid", size = "md", colorscheme = "gold", className, ...props }, ref) => {
        // Ensure we have valid values (fallback to defaults if null/undefined)
        const safeVariant = variant || "solid";
        const safeColorscheme = colorscheme || "gold";

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