import {type ComponentProps, forwardRef} from "react";
import { cn } from "@/utils";
import {cva, type VariantProps} from 'class-variance-authority'

const buttonStyles = cva(
    [
    "rounded-lg", "font-semibold","focus:outline-none","disabled:cursor-not-allowed",
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
                purpleToBlue:
                    "text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800",
                cyanToBlue:
                    "text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:ring-cyan-300 dark:focus:ring-cyan-800",
                greenToBlue:
                    "text-white bg-gradient-to-br from-green-400 to-blue-600 hover:bg-gradient-to-bl focus:ring-4 focus:ring-green-200 dark:focus:ring-green-800",
                purpleToPink:
                    "text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:bg-gradient-to-l focus:ring-4 focus:ring-purple-200 dark:focus:ring-purple-800",
                pinkToOrange:
                    "text-white bg-gradient-to-br from-pink-500 to-orange-400 hover:bg-gradient-to-bl focus:ring-4 focus:ring-pink-200 dark:focus:ring-pink-800",
                tealToLime:
                    "text-gray-900 bg-gradient-to-r from-teal-200 to-lime-200 hover:bg-gradient-to-l focus:ring-4 focus:ring-lime-200 dark:focus:ring-teal-700",
                redToYellow:
                    "text-gray-900 bg-gradient-to-r from-red-200 via-red-300 to-yellow-200 hover:bg-gradient-to-bl focus:ring-4 focus:ring-red-100 dark:focus:ring-red-400",
            },
        },
  /*      compoundVariants: [
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
        ],*/
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