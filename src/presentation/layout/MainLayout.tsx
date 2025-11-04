// MainLayout.tsx
import type { ReactNode } from "react";

type MainLayoutProps = {
    children: ReactNode;
};

export function MainLayout({ children }: MainLayoutProps) {
    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden">
            {/* Dynamic background that adapts to page content */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                {/* Animated background elements */}
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-bounce delay-500"></div>
            </div>

            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(15)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${2 + Math.random() * 3}s`
                        }}
                    ></div>
                ))}
            </div>

            {/* Content with proper z-index */}
            <div className="relative z-10 flex flex-col min-h-screen">
                <main className="flex-1 container mx-auto px-4 py-6">
                    {children}
                </main>
                <footer className="bg-black/20 backdrop-blur-md border-t border-white/10 text-center py-6 text-sm">
                    <div className="text-gray-300 hover:text-white transition-colors">
                        © {new Date().getFullYear()}
                        <span className="mx-2 text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text font-semibold">
                            JollyApp
                        </span>
                        All rights reserved.
                    </div>
                    <div className="mt-2 flex justify-center gap-4 text-xs text-gray-400">
                        <span className="hover:text-purple-400 cursor-pointer transition-colors">Privacy</span>
                        <span className="hover:text-purple-400 cursor-pointer transition-colors">Terms</span>
                        <span className="hover:text-purple-400 cursor-pointer transition-colors">Support</span>
                    </div>
                </footer>
            </div>
        </div>
    );
}