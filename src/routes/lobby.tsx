import {createFileRoute} from '@tanstack/react-router'
import {MainLayout} from "../presentation/layout/MainLayout";
import {LobbyPage} from "../presentation/pages/LobbyPage/LobbyPage";

export const Route = createFileRoute('/lobby')({
    component: () =>(
        <MainLayout>
            <LobbyPage />
        </MainLayout>
    ),
})
