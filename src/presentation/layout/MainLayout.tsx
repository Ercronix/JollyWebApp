import type { ReactNode } from "react";
import { Navbar } from "../components/Navbar";

type MainLayoutProps = {
    children: ReactNode;
};

export function MainLayout({ children }: MainLayoutProps) {
    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-500 to-blue-950">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
            <footer className="bg-gray-100 dark:bg-gray-800 text-center py-4 text-sm text-gray-600 dark:text-gray-400">
                © {new Date().getFullYear()} JollyApp. All rights reserved.
            </footer>
        </div>
    );
}
