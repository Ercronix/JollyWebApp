import { createFileRoute } from '@tanstack/react-router'
import {MainLayout} from "../presentation/layout/MainLayout";

export const Route = createFileRoute('/about')({
    component: About,
})

function About() {
    return <MainLayout>
        <div className="p-2">Hello from About!</div>
    </MainLayout>
}