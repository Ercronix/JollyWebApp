import { createFileRoute } from '@tanstack/react-router'
import { HistoryPage} from "../presentation/pages/HistoryPage/HistoryPage"
import {MainLayout} from "../presentation/layout/MainLayout";

export const Route = createFileRoute('/history')({
  component: () => (
      <MainLayout>
        <HistoryPage />
      </MainLayout>
  ),
})

