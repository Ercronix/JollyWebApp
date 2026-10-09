import {describe, expect, it, vi} from "vitest";
import {createLogger} from "./logger";

describe("createLogger", () => {
    it("hides debug output when debug is off but keeps warnings and errors", () => {
        const log = vi.spyOn(console, "log").mockImplementation(() => {});
        const error = vi.spyOn(console, "error").mockImplementation(() => {});
        const logger = createLogger(false);

        logger.debug("noise");
        logger.error("broken", 1);

        expect(log).not.toHaveBeenCalled();
        expect(error).toHaveBeenCalledWith("broken", 1);
    });

    it("prints debug output when debug is on", () => {
        const log = vi.spyOn(console, "log").mockImplementation(() => {});

        createLogger(true).debug("details", {a: 1});

        expect(log).toHaveBeenCalledWith("details", {a: 1});
    });
});
