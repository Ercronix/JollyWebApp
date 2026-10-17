import React, {useRef, useState} from "react";
import type {Game} from "@/types";
import {roundDurations} from "@/core/roundTimes";
import {useElapsedTime} from "@/core/hooks/useElapsedTime";
import {PlayerPointsChart} from "@/presentation/components/PlayerPointsChart";
import {RoundTimesChart} from "@/presentation/components/RoundTimesChart";

const PAGES = ["Points history", "Round times"];

/**
 * The points history and the round times as two pages you swipe between
 */
export const GameCharts: React.FC<{ game: Game }> = ({game}) => {
    const scroller = useRef<HTMLDivElement>(null);
    const [page, setPage] = useState(0);
    // Set while a dot click scrolls the panel, so passing the halfway point late doesn't move the dot back
    const scrollingTo = useRef<number | null>(null);

    // Ticks every second, so the current round's bar grows
    const lastRoundEnd = game.roundEndedAt?.at(-1) ?? game.createdAt;
    const liveMs = useElapsedTime(game.isFinished ? undefined : lastRoundEnd);
    const durations = roundDurations(game, new Date(lastRoundEnd).getTime() + (liveMs ?? 0));

    const goTo = (index: number) => {
        const el = scroller.current;
        // Already there: nothing will scroll, so nothing would end the lock
        if (el && Math.abs(el.scrollLeft - index * el.clientWidth) >= 1) scrollingTo.current = index;
        el?.scrollTo({left: index * el.clientWidth, behavior: "smooth"});
        setPage(index);
    };

    const pageFromScroll = () => {
        const el = scroller.current;
        if (el && el.clientWidth) setPage(Math.round(el.scrollLeft / el.clientWidth));
    };

    const onScroll = () => {
        const el = scroller.current;
        // Without scrollend (older Safari), reaching the clicked page ends the click's scroll
        if (el && scrollingTo.current !== null && Math.abs(el.scrollLeft - scrollingTo.current * el.clientWidth) < 1) {
            scrollingTo.current = null;
            return;
        }
        if (scrollingTo.current === null) pageFromScroll();
    };

    const onScrollEnd = () => {
        scrollingTo.current = null;
        pageFromScroll();
    };

    return (
        <section aria-label="Charts">
            <div ref={scroller}
                 onScroll={onScroll}
                 onScrollEnd={onScrollEnd}
                 className="flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex w-full shrink-0 snap-start">
                    <PlayerPointsChart players={game.players} currentRound={game.currentRound}
                                       roundDurations={durations?.rounds}/>
                </div>
                <div className="flex w-full shrink-0 snap-start">
                    <RoundTimesChart durations={durations}/>
                </div>
            </div>

            <div className="flex justify-center">
                {PAGES.map((label, index) => (
                    <button key={label}
                            type="button"
                            aria-label={label}
                            aria-current={page === index ? "true" : undefined}
                            onClick={() => goTo(index)}
                            className="flex items-center justify-center w-11 h-11">
                        <span aria-hidden="true"
                              className={`block w-2 h-2 rounded-full ${page === index ? "bg-accent" : "bg-line"}`}/>
                    </button>
                ))}
            </div>
        </section>
    );
};
