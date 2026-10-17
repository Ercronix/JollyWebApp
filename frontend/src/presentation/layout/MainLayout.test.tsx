import {describe, expect, it} from "vitest";
import {render} from "@testing-library/react";
import {MainLayout} from "./MainLayout";

function particleStyles(container: HTMLElement) {
    return Array.from(container.querySelectorAll<HTMLElement>(".animate-pulse.w-1"))
        .map(el => el.getAttribute("style"));
}

describe("MainLayout", () => {
    // Regression: background particles called Math.random() during render,
    // so every re-render (e.g. a live score update) made them jump around.
    it("keeps background particles in place across re-renders", () => {
        const {container, rerender} = render(<MainLayout><p>first</p></MainLayout>);
        const before = particleStyles(container);

        rerender(<MainLayout><p>second</p></MainLayout>);

        expect(before).toHaveLength(15);
        expect(particleStyles(container)).toEqual(before);
    });

    // Regression: the root clipped the oversized background blobs with overflow: hidden, which the
    // browser can still scroll, so focusing the score input on a phone shifted the page sideways.
    it("clips the background without making the page scrollable sideways", () => {
        const {container} = render(<MainLayout><p>page</p></MainLayout>);
        const root = container.firstElementChild as HTMLElement;

        expect(root.classList).toContain("overflow-clip");
        expect(root.classList).not.toContain("overflow-hidden");
    });

    it("can hide the footer, for pages with a bottom action bar", () => {
        const {container} = render(<MainLayout hideFooter><p>page</p></MainLayout>);

        expect(container.querySelector("footer")).toBeNull();
    });
});
