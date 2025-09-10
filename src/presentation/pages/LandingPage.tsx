import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/presentation/components/Button";

export function LandingPage() {
    const navigate = useNavigate();

    return (
        <>
            <h1 className="text-4xl font-bold mb-4 dark:text-white">Welcome to the JollyApp</h1>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
                Join a lobby to get started!
            </p>
            <Button onClick={() => navigate({ to: "/lobby" })} colorscheme="pinkToOrange">
                Join Lobby
            </Button>
        </>
    );
}