import { createFileRoute } from '@tanstack/react-router'
//import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
    component: LandingPage,
})
export default function LandingPage() {
    //const navigate = useNavigate()

    return (
        <div className="page"
        />
    )
}
