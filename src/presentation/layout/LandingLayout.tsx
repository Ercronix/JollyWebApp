import type { ReactNode } from "react";

type LandingLayoutProps = { children: ReactNode };

export function LandingLayout({ children }: LandingLayoutProps) {
    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-500 to-pink-950">
            {children}
        </div>
    );
}