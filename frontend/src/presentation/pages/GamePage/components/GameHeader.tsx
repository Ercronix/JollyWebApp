import React from "react";
import {useNavigate} from "@tanstack/react-router";

interface GameHeaderProps {
    lobbyName?: string;
    accessCode?: string;
    onOpenSettings?: () => void;
}

const iconButton = "w-11 h-11 flex-none flex items-center justify-center rounded-xl hover:bg-on-felt/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold";

export const GameHeader: React.FC<GameHeaderProps> = ({lobbyName, accessCode, onOpenSettings}) => {
    const navigate = useNavigate();

    return (
        <header className="flex items-center gap-1 -mx-2">
            <button type="button" aria-label="Back to lobbies" onClick={() => navigate({to: "/lobby"})}
                    className={`${iconButton} text-on-felt`}>
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M15 19l-7-7 7-7"/>
                </svg>
            </button>

            <div className="flex-1 min-w-0 text-center">
                <h1 className="font-display text-xl sm:text-2xl font-extrabold text-on-felt truncate">{lobbyName || "Card Game"}</h1>
                {accessCode && (
                    <div className="flex items-center justify-center gap-1 text-xs text-on-felt-muted">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                            <rect x="5" y="11" width="14" height="10" rx="2"/>
                            <path d="M8 11V7a4 4 0 018 0v4"/>
                        </svg>
                        <span>Private · Code {accessCode}</span>
                    </div>
                )}
            </div>

            {onOpenSettings ? (
                <button type="button" aria-label="Game settings" onClick={onOpenSettings} className={`${iconButton} text-on-felt`}>
                    <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <circle cx="12" cy="5" r="1.8"/>
                        <circle cx="12" cy="12" r="1.8"/>
                        <circle cx="12" cy="19" r="1.8"/>
                    </svg>
                </button>
            ) : (
                <div className="w-11 flex-none"/>
            )}
        </header>
    );
};
