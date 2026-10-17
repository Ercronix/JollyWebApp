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
            {/* Quiet dark background, a little lighter at the top */}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,var(--color-ground-top)_0%,var(--color-ground)_45%,var(--color-ground-deep)_100%)]"/>

            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {PARTICLES.map((style, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-fg/[0.06] rounded-full animate-pulse"
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
                    <footer className="border-t border-line text-center pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-xs text-fg-muted">
                        © {new Date().getFullYear()} JollyApp
                    </footer>
                )}
            </div>
        </div>
    );
}