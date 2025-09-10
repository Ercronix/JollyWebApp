import { createFileRoute } from '@tanstack/react-router'
import {Button} from "../presentation/components/Button";
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
    component: LandingPage,
})
export default function LandingPage() {
    const navigate = useNavigate()

    return (
        <div className="page">
        <Button onClick={() => navigate({to: '/lobby'})} type="submit" variant={"outline"} className={"mt-10"}>
        Login
        </Button>
        </div>
    )
}
