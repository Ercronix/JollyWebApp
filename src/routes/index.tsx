import {createFileRoute} from '@tanstack/react-router'
import {LandingLayout} from "../presentation/layout/LandingLayout";
import {LandingPage} from "../presentation/pages/LandingPage";

export const Route = createFileRoute('/')({
    component: () => (
        <LandingLayout>
            <LandingPage></LandingPage>
        </LandingLayout>
    ),
})

