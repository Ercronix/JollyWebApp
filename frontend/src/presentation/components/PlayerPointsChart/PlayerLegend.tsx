import type {Player} from '@/types';
import {suitForSeat} from '@/core/suits';
import {playerColor} from './playerColors';

/**
 * Legend for the points charts: each player's line colour and suit, as on their card
 */
export function PlayerLegend({players}: { players: Player[] }) {
    return (
        <ul aria-label="Players" className="flex flex-wrap gap-x-3.5 gap-y-1.5 justify-center mt-1">
            {players.map((player, i) => (
                <li key={player.userId} className="flex items-center gap-1.5 text-[13px] font-medium text-fg">
                    <span
                        aria-hidden="true"
                        className="w-3 h-[3px] rounded-full"
                        style={{backgroundColor: playerColor(i)}}
                    />
                    <span>{suitForSeat(i).symbol} {player.name}</span>
                </li>
            ))}
        </ul>
    );
}
