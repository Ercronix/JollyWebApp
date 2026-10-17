import React, {useId} from "react";
import {toggleSign} from "@/core/scores";

interface ScoreInputProps {
    tempScore: string;
    scoreError?: string;
    isPending: boolean;
    roundNumber: number;
    onScoreInput: (value: string) => void;
    onCalculatorOpen: () => void;
    onSubmit: () => void;
}

// Haptic feedback utility function
const triggerHaptic = (duration: number = 10) => {
    if (navigator.vibrate) {
        navigator.vibrate(duration);
    }
};

const squareButton = "w-12 h-[52px] flex-none rounded-[14px] border border-line-strong bg-surface hover:bg-surface-2 text-fg flex items-center justify-center";

export const ScoreInput: React.FC<ScoreInputProps> = ({
                                                          tempScore,
                                                          scoreError,
                                                          isPending,
                                                          roundNumber,
                                                          onScoreInput,
                                                          onCalculatorOpen,
                                                          onSubmit,
                                                      }) => {
    const inputId = useId();

    const handleCalculatorOpen = () => {
        triggerHaptic(15); // Light tap for opening calculator
        onCalculatorOpen();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (tempScore && !isPending) {
            triggerHaptic(30); // Medium tap for important action
            onSubmit();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <label htmlFor={inputId} className="text-[13px] text-fg-muted">Your score, round {roundNumber}</label>
            <div className="flex gap-2">
                <button type="button" aria-label="Toggle minus" onClick={() => onScoreInput(toggleSign(tempScore))}
                        className={`${squareButton} text-2xl font-bold`}>
                    ±
                </button>
                <input
                    id={inputId}
                    type="text"
                    inputMode="numeric"
                    enterKeyHint="send"
                    autoComplete="off"
                    value={tempScore}
                    onChange={(e) => onScoreInput(e.target.value)}
                    placeholder="0"
                    aria-invalid={!!scoreError}
                    className="flex-1 min-w-0 h-[52px] rounded-[14px] border-[1.5px] border-accent bg-ground text-fg text-2xl font-extrabold text-center placeholder-fg-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
                <button type="button" aria-label="Open score calculator" onClick={handleCalculatorOpen} className={squareButton}>
                    <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                        <rect x="4" y="2" width="16" height="20" rx="2"/>
                        <path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h8"/>
                    </svg>
                </button>
                <button type="submit" disabled={!tempScore || isPending}
                        className="h-[52px] px-5 flex-none rounded-[14px] bg-accent text-accent-ink font-extrabold disabled:opacity-50">
                    Submit
                </button>
            </div>
            {scoreError && (
                <p role="alert" className="text-sm font-semibold text-bad">{scoreError}</p>
            )}
        </form>
    );
};
