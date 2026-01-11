import {createFileRoute} from '@tanstack/react-router'
import {LandingPage} from "../presentation/pages/LandingPage";
import {MainLayout} from "../presentation/layout/MainLayout";

export const Route = createFileRoute('/')({
    component: () => (
        <MainLayout>
            <LandingPage></LandingPage>
        </MainLayout>
    ),
})

