import { createFileRoute } from '@tanstack/react-router'
import { Button } from '../presentation/components/Button'
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
    component: LandingPage,
})
export default function LandingPage() {
    const navigate = useNavigate()

    return (
        <div className="page">
            <h1>Welcome to the Game!</h1>
            <Button
                label="Enter Lobby"
                primary
                size="large"
                onClick={() => navigate({ to: '/lobby' })}
            />
        </div>
    )
}
