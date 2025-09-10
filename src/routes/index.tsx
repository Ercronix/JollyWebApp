import {createFileRoute} from '@tanstack/react-router'
import {LandingLayout} from "../presentation/layout/LandingLayout/LandingLayout";
import {LandingPage} from "../presentation/pages/LandingPage";

export const Route = createFileRoute('/')({
    component: () => (
        <LandingLayout colorscheme={"pinkToOrange"}>
            <LandingPage></LandingPage>
        </LandingLayout>
    ),
})

