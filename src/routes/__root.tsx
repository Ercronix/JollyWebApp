import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import {Navbar} from "../presentation/components/Navbar";

export const Route = createRootRoute({
    component: () => (
        <>
            <Navbar />
            <Outlet />
            <TanStackRouterDevtools />
        </>
    ),
})