import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/presentation/components/Button";
import {Input} from "../components/input";

export function LandingPage() {
    const navigate = useNavigate();

    return (
        <>
            <h1 className="text-4xl font-bold mb-4 dark:text-white">Welcome to the JollyApp</h1>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
                Join a lobby to get started!
            </p>
            <Button onClick={() => navigate({ to: "/lobby" })} colorscheme="purpleToBlue" variant="solid">
                Join Lobby
            </Button>
            <div className="text-sm text-gray-400"></div>
            <Input  placeholder="Enter your name"
                    className="w-60 text-white bg-white/5 border-white/30 focus:border-purple-400 focus:ring-purple-400/50 placeholder-gray-400 transition-all duration-300 hover:bg-white/10"
            />
        </>
    );
}