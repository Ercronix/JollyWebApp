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
            {/* Dynamic background that adapts to page content */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
                {/* Animated background elements */}
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-bounce delay-500"></div>
            </div>

            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {PARTICLES.map((style, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
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
                    <footer className="border-t border-white/10 text-center pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-xs text-slate-400">
                        © {new Date().getFullYear()} JollyApp
                    </footer>
                )}
            </div>
        </div>
    );
}