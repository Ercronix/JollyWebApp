import {createFileRoute} from '@tanstack/react-router'

export const Route = createFileRoute('/lobby')({
    component: LobbyPage,
})
function LobbyPage() {
    const players = ['Alice', 'Bob'] // mock players for now
    return (
        <div className="page">
            <h1>Lobby</h1>
            <ul>
                {players.map((player) => (
                    <li key={player}>{player}</li>
                ))}
            </ul>
            <p>Waiting for the game to start...</p>
        </div>
    )
}