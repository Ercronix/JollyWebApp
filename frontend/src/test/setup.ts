import {afterEach} from "vitest";
import {cleanup} from "@testing-library/react";

// Node >= 25 ships its own localStorage global (undefined unless --localstorage-file
// is set), which shadows jsdom's. Point the globals back at jsdom's storage.
const dom = (globalThis as unknown as {jsdom?: {window: Window}}).jsdom;
if (dom) {
    for (const name of ["localStorage", "sessionStorage"] as const) {
        Object.defineProperty(globalThis, name, {value: dom.window[name], configurable: true, writable: true});
    }
}

afterEach(() => cleanup());
