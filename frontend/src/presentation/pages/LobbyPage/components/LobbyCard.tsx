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
        <div className="rounded-[14px] bg-card text-ink shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
            <div className="flex items-center gap-2 py-1.5 pl-3.5 pr-1">
                <div className="flex-1 min-w-0">
                    <div className="text-base font-bold truncate">{lobby.name}</div>
                    <div className="text-[13px] text-ink-muted">
                        {lobby.playerCount} {lobby.playerCount === 1 ? "player" : "players"}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => onJoin(lobby)}
                    disabled={isJoining}
                    className="h-11 px-[18px] rounded-xl bg-felt hover:bg-felt-light text-card font-extrabold disabled:opacity-50"
                >
                    Join
                </button>
                <button
                    type="button"
                    aria-label={`More actions for ${lobby.name}`}
                    aria-expanded={showActions}
                    onClick={() => setShowActions(!showActions)}
                    className={`w-11 h-11 flex-none flex items-center justify-center rounded-xl text-ink hover:bg-card-muted ${showActions ? "bg-card-muted" : ""}`}
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
                            className="flex-1 min-h-11 rounded-xl border border-card-line hover:bg-card-muted text-sm font-bold">
                        Archive
                    </button>
                    <button type="button" onClick={() => runAction(onDelete)}
                            className="flex-1 min-h-11 rounded-xl bg-danger-soft hover:bg-[#f7dfe3] border border-[#e3c2c6] text-suit-red text-sm font-bold">
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
};
