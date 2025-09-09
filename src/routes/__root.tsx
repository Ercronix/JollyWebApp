import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import {Navbar} from "../presentation/components/Navbar";

export const Route = createRootRoute({
    component: () => (
        <div className={"min-h-screen bg-gray-500:35"}>
            <Navbar />
            <main className="p-4">
                <Outlet />
            </main>
            <TanStackRouterDevtools />
        </div>
    ),
})