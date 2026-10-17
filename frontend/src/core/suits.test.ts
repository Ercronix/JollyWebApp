import {describe, expect, it} from "vitest";
import {suitForSeat} from "./suits";

describe("suitForSeat", () => {
    it("deals the four suits in seat order", () => {
        expect([0, 1, 2, 3].map(i => suitForSeat(i).symbol)).toEqual(["♠", "♥", "♦", "♣"]);
    });

    it("starts over after four seats, so up to 8 players all get a suit", () => {
        expect(suitForSeat(4)).toEqual(suitForSeat(0));
        expect(suitForSeat(7)).toEqual(suitForSeat(3));
    });

    it("marks hearts and diamonds as red", () => {
        expect([0, 1, 2, 3].map(i => suitForSeat(i).isRed)).toEqual([false, true, true, false]);
    });
});
