import { createFileRoute } from '@tanstack/react-router';
import { MainLayout } from '@/presentation/layout/MainLayout';
import { JoinPage } from '@/presentation/pages/JoinPage/JoinPage';

export const Route = createFileRoute('/Join/$code')({
    component: () => (
        <MainLayout>
            <JoinPage />
        </MainLayout>
    ),
});
