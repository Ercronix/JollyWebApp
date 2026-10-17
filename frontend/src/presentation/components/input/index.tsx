import { cn } from "@/utils";
import { cva, type VariantProps } from "class-variance-authority";
import {type ComponentProps, forwardRef } from "react";

const inputStyles = cva([
    "w-full",
    "border",
    "border-card-line",
    "bg-white",
    "text-ink",
    "px-3.5",
    "py-2",
    "rounded-xl",
    "transition-all",
    "duration-100",
    "outline-none",
    "focus:border-felt",
    "focus:ring-2",
    "focus:ring-gold/60",
    "placeholder:text-ink-muted/70",
    "disabled:opacity-60",
]);

type InputProps = ComponentProps<"input"> & VariantProps<typeof inputStyles>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, ...props }, ref) => {
        return (
            <input
                ref={ref}
                type="text"
                autoComplete="off"
                className={cn(inputStyles({ className }))}
                {...props}
            />
        );
    }
);