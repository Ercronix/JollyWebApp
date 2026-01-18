import React from "react";
import {Text} from "@/presentation/components/Text";
import {useNavigate} from "@tanstack/react-router";

interface GameHeaderProps {
    lobbyName?: string;
}

export const GameHeader: React.FC<GameHeaderProps> = ({lobbyName}) => {
    const navigate = useNavigate();

    return (
        <div className="relative flex items-center justify-between w-full max-w-4xl mx-auto">
            <button
                onClick={() => navigate({to: "/lobby"})}
                className="flex items-center gap-2 text-purple-200 hover:text-white transition-colors
                focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-lg p-2 z-10"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                </svg>
                <span className="font-medium">Back</span>
            </button>

            <Text as="h1" size="3xl" weight="bold"
                  className="absolute left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-400 via-white-300 to-blue-400 bg-clip-text text-transparent text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-center whitespace-nowrap">
                {lobbyName || "Card Game"}
            </Text>

            <div className="w-[88px]"/>
        </div>
    );
};