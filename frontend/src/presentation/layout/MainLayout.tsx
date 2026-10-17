// MainLayout.tsx
import type { ReactNode } from "react";

type MainLayoutProps = {
    children: ReactNode;
    // Pages with a bottom action bar (the game) hide the footer
    hideFooter?: boolean;
};

// Randomised once per page load, not per render, so particles don't jump on updates
const PARTICLES = Array.from({ length: 15 }, () => ({
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 3}s`,
    animationDuration: `${2 + Math.random() * 3}s`,
}));

export function MainLayout({ children, hideFooter = false }: MainLayoutProps) {
    return (
        <div className="min-h-dvh flex flex-col relative overflow-clip">
            {/* Felt table background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_30%,var(--color-felt-light)_0%,var(--color-felt)_55%,var(--color-felt-dark)_100%)]"/>

            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {PARTICLES.map((style, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-on-felt/10 rounded-full animate-pulse"
                        style={style}
                    ></div>
                ))}
            </div>

            {/* Content with proper z-index */}
            <div className="relative z-10 flex flex-col min-h-dvh">
                <main className="flex-1 w-full max-w-2xl mx-auto pt-[max(1rem,env(safe-area-inset-top))] pb-6 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
                    {children}
                </main>
                {!hideFooter && (
                    <footer className="border-t border-on-felt/10 text-center pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-xs text-on-felt-muted">
                        © {new Date().getFullYear()} JollyApp
                    </footer>
                )}
            </div>
        </div>
    );
}