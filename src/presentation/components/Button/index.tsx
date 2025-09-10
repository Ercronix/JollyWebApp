import {type ComponentProps, forwardRef} from "react";
import { cn } from "@/utils";
import {cva, type VariantProps} from 'class-variance-authority'

const buttonStyles = cva(
    [
    "rounded-md", "font-semibold","focus:outline-none","disabled:cursor-not-allowed",
    ],
    {
        variants: {
            variant: {
                solid: "",
                outline: "border-2",
                ghost: "transition-colors duration-500",
            },
            size: {
                sm: "px-4 py-2 text-sm",
                md: "px-6 py-2 text-md",
                lg: "px-8 py-3 text-lg",
            },
            colorscheme:{
              primary: "text-white",
            },
        },
        compoundVariants: [
            {
                variant: "solid",
                colorscheme: "primary",
                className: "bg-blue-500 hover:bg-blue-100",
            },
            {
                variant: "outline",
                colorscheme: "primary",
                className:
                    "text-blue-600 border-blue-500 bg-transparent hover:bg-blue-100",
            },
            {
                variant: "ghost",
                colorscheme: "primary",
                className: "text-blue-600 bg-transparent hover:bg-blue-100",
            },
        ],
        defaultVariants: {
            variant: "solid",
            size: "md",
            colorscheme: "primary",
        },
    }
);
type ButtonProps = ComponentProps<"button"> & VariantProps<typeof buttonStyles>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant, size, colorscheme, className, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(buttonStyles({ variant, size, colorscheme, className }))}
                {...props}
            />
        );
    }
);