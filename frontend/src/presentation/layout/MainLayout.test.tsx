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
});
