import { describe, it, expect, beforeEach } from 'vitest';
import { loginAs, createLobbyWith, requireApp } from './helpers.mjs';

const Lobby = requireApp('../models/Lobby');
const Game = requireApp('../models/Game');
const LobbiesService = requireApp('../service/LobbiesService');

const HOUR = 60 * 60 * 1000;
const hoursFromNow = (hours) => new Date(Date.now() + hours * HOUR);

let alice, bob;

beforeEach(async () => {
    alice = await loginAs('Alice');
    bob = await loginAs('Bob');
});

const listed = async () => (await alice.get('/api/lobbies').expect(200)).body.map(l => l.id);
const history = async () => (await alice.get('/api/lobbies/history').expect(200)).body;

async function playedLobby() {
    const { lobby, gameId } = await createLobbyWith(alice, [bob]);
    await alice.post(`/api/games/${gameId}/submitScore`, { score: 10 }).expect(200);
    return { lobby, gameId };
}

// Issue #49: a game should be archived after 72h if it hasn't been touched
describe('archiving stale games', () => {
    it('archives a played game untouched for 72 hours', async () => {
        const { lobby } = await playedLobby();

        await LobbiesService.archiveStaleLobbies(hoursFromNow(73));

        expect(await listed()).toEqual([]);
        expect(await history()).toEqual([expect.objectContaining({ id: lobby.id, archived: true })]);
    });

    it('keeps a game touched within the last 72 hours', async () => {
        const { lobby } = await playedLobby();

        await LobbiesService.archiveStaleLobbies(hoursFromNow(71));

        expect(await listed()).toEqual([lobby.id]);
    });

    it('counts playing the game as touching it, not only lobby changes', async () => {
        const { lobby, gameId } = await playedLobby();
        await Lobby.collection.updateOne({ _id: Lobby.castObject({ _id: lobby.id })._id }, { $set: { updatedAt: hoursFromNow(-100) } });

        await bob.post(`/api/games/${gameId}/submitScore`, { score: 20 }).expect(200);
        await LobbiesService.archiveStaleLobbies(hoursFromNow(71));

        expect(await listed()).toEqual([lobby.id]);
    });

    it('deletes an unplayed game instead, like when its last player leaves', async () => {
        const { gameId } = await createLobbyWith(alice, [bob]);

        await LobbiesService.archiveStaleLobbies(hoursFromNow(73));

        expect(await listed()).toEqual([]);
        expect(await history()).toEqual([]);
        expect(await Game.findById(gameId)).toBeNull();
    });

    // Lobbies and games from before updatedAt existed must not all be archived on the first run after deploying
    it('starts counting from the first run for games without a last-change time', async () => {
        const { lobby, gameId } = await playedLobby();
        await Lobby.collection.updateOne({ _id: Lobby.castObject({ _id: lobby.id })._id },
            { $unset: { updatedAt: 1 }, $set: { createdAt: hoursFromNow(-100) } });
        await Game.collection.updateOne({ _id: Game.castObject({ _id: gameId })._id },
            { $unset: { updatedAt: 1 }, $set: { createdAt: hoursFromNow(-100) } });

        await LobbiesService.archiveStaleLobbies(new Date());
        expect(await listed()).toEqual([lobby.id]);

        await LobbiesService.archiveStaleLobbies(hoursFromNow(73));
        expect(await listed()).toEqual([]);
    });
});
