import {describe, expect, it, vi} from "vitest";
import {fireEvent, render, screen} from "@testing-library/react";
import {LobbyCard} from "./LobbyCard";
import type {Lobby} from "@/types";

const lobby = {id: "l1", name: "Friday", playerCount: 3} as Lobby;
const props = {lobby, isJoining: false, onJoin: vi.fn(), onArchive: vi.fn(), onDelete: vi.fn()};

// The archive and delete buttons used to appear only on hover, so touch screens never showed them
describe("LobbyCard", () => {
    it("joins the lobby", () => {
        const onJoin = vi.fn();
        render(<LobbyCard {...props} onJoin={onJoin}/>);

        fireEvent.click(screen.getByRole("button", {name: "Join"}));

        expect(onJoin).toHaveBeenCalledWith(lobby);
    });

    it("reveals archive and delete from the actions button", () => {
        const onArchive = vi.fn();
        const onDelete = vi.fn();
        render(<LobbyCard {...props} onArchive={onArchive} onDelete={onDelete}/>);

        expect(screen.queryByRole("button", {name: "Archive"})).toBeNull();
        fireEvent.click(screen.getByRole("button", {name: "More actions for Friday"}));
        fireEvent.click(screen.getByRole("button", {name: "Archive"}));
        fireEvent.click(screen.getByRole("button", {name: "More actions for Friday"}));
        fireEvent.click(screen.getByRole("button", {name: "Delete"}));

        expect(onArchive).toHaveBeenCalledWith(lobby);
        expect(onDelete).toHaveBeenCalledWith(lobby);
    });
});
