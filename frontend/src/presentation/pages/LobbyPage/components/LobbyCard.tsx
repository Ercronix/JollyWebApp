import React, {useState} from "react";
import type {Lobby} from "@/types";

interface LobbyCardProps {
    lobby: Lobby;
    isJoining: boolean;
    onJoin: (lobby: Lobby) => void;
    onArchive: (lobby: Lobby) => void;
    onDelete: (lobby: Lobby) => void;
}

export const LobbyCard: React.FC<LobbyCardProps> = ({lobby, isJoining, onJoin, onArchive, onDelete}) => {
    // Actions sit behind a button instead of appearing on hover, which touch screens can't do
    const [showActions, setShowActions] = useState(false);

    const runAction = (action: (lobby: Lobby) => void) => {
        setShowActions(false);
        action(lobby);
    };

    return (
        <div className="rounded-2xl bg-white/[0.08] border border-white/[0.12] text-white">
            <div className="flex items-center gap-2 py-1.5 pl-3.5 pr-1">
                <div className="flex-1 min-w-0">
                    <div className="text-base font-semibold truncate">{lobby.name}</div>
                    <div className="text-[13px] text-slate-400">
                        {lobby.playerCount} {lobby.playerCount === 1 ? "player" : "players"}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => onJoin(lobby)}
                    disabled={isJoining}
                    className="h-11 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 font-bold disabled:opacity-50"
                >
                    Join
                </button>
                <button
                    type="button"
                    aria-label={`More actions for ${lobby.name}`}
                    aria-expanded={showActions}
                    onClick={() => setShowActions(!showActions)}
                    className="w-11 h-11 flex-none flex items-center justify-center rounded-xl text-slate-300 hover:bg-white/10"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <circle cx="12" cy="5" r="1.8"/>
                        <circle cx="12" cy="12" r="1.8"/>
                        <circle cx="12" cy="19" r="1.8"/>
                    </svg>
                </button>
            </div>
            {showActions && (
                <div className="flex gap-2 px-3 pb-3">
                    <button type="button" onClick={() => runAction(onArchive)}
                            className="flex-1 min-h-11 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-semibold">
                        Archive
                    </button>
                    <button type="button" onClick={() => runAction(onDelete)}
                            className="flex-1 min-h-11 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/35 text-red-200 text-sm font-semibold">
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
};
