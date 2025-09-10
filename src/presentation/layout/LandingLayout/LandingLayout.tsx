import type { ReactNode, ComponentProps } from "react";
import { forwardRef } from "react";
import { cn } from "@/utils";
import { cva, type VariantProps } from "class-variance-authority";

const landingStyles = cva(
    [
        "h-screen w-screen flex flex-col items-center justify-center",
    ],
    {
        variants: {
            colorscheme: {
                purpleToBlue: "bg-gradient-to-br from-purple-600 to-blue-500",
                cyanToBlue: "bg-gradient-to-r from-cyan-500 to-blue-500",
                greenToBlue: "bg-gradient-to-br from-green-400 to-blue-600",
                purpleToPink: "bg-gradient-to-r from-purple-500 to-pink-500",
                pinkToOrange: "bg-gradient-to-br from-pink-500 to-orange-400",
                tealToLime: "bg-gradient-to-r from-teal-200 to-lime-200",
                redToYellow: "bg-gradient-to-r from-red-200 via-red-300 to-yellow-200",
            },
        },
        defaultVariants: {
            colorscheme: "purpleToPink",
        },
    }
);

type LandingLayoutProps = ComponentProps<"div"> & VariantProps<typeof landingStyles> & {
    children: ReactNode;
};

export const LandingLayout = forwardRef<HTMLDivElement, LandingLayoutProps>(
    ({ colorscheme, className, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(landingStyles({ colorscheme, className }))}
                {...props}
            >
                {children}
            </div>
        );
    }
);
