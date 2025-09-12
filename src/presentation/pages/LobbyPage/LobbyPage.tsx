import { Button } from "@/presentation/components/Button";
import { Input } from "@/presentation/components/input";
import { Text } from "@/presentation/components/Text";

type Lobby = {
    id: number;
    name: string;
    players: number;
};

type LobbyPageProps = {
    lobbies?: Lobby[];
};

export function LobbyPage({ lobbies }: LobbyPageProps) {
    const lobbyData =
        lobbies ?? [
            { id: 1, name: "Chill Gamers", players: 2 },
            { id: 2, name: "Pro Squad", players: 4 },
            { id: 3, name: "Casual Lounge", players: 1 },
            { id: 4, name: "Night Owls", players: 6 },
        ];

    return (
        <div className="flex flex-col items-center gap-12 py-8">
            {/* Header */}
            <div className="text-center space-y-6 animate-in fade-in duration-1000">
                <div className="relative">
                    <Text
                        as="h1"
                        size="3xl"
                        weight="bold"
                        className="bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent animate-pulse text-4xl md:text-5xl lg:text-6xl"
                    >
                        Game Lobbies
                    </Text>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 opacity-20 blur-xl"></div>
                </div>
                <Text size="lg" className="text-gray-300 animate-in slide-in-from-bottom-4 duration-1000 delay-300">
                    Join a lobby or create one
                </Text>

                {/* Stats */}
                <div className="flex justify-center gap-8 mt-8">
                    <div className="text-center group">
                        <div className="text-2xl font-bold text-white group-hover:text-purple-300 transition-colors">
                            {lobbyData.length}
                        </div>
                        <div className="text-sm text-gray-400">Active Lobbies</div>
                    </div>
                    <div className="text-center group">
                        <div className="text-2xl font-bold text-white group-hover:text-blue-300 transition-colors">
                            {lobbyData.reduce((acc, lobby) => acc + lobby.players, 0)}
                        </div>
                        <div className="text-sm text-gray-400">Players Online</div>
                    </div>
                </div>
            </div>

            {/* Lobby List */}
            <div className="w-full max-w-4xl space-y-4">
                <div className="text-center mb-6">
                    <Text size="xl" weight="semibold" className="text-white mb-2">
                        Available Lobbies
                    </Text>
                    <div className="w-24 h-1 bg-gradient-to-r from-purple-400 to-blue-400 mx-auto rounded-full"></div>
                </div>

                {lobbyData.length === 0 ? (
                    <div className="text-center text-gray-400">No lobbies available. Create one!</div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {lobbyData.map((lobby, index) => (
                            <div
                                key={lobby.id}
                                className={`group relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-6 shadow-lg hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 hover:-translate-y-2 hover:scale-105 cursor-pointer animate-in slide-in-from-bottom-8 duration-700`}
                                style={{
                                    animationDelay: `${index * 150}ms`,
                                }}
                            >
                                {/* Animated Border */}
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/50 via-pink-500/50 to-blue-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-sm"></div>

                                <div className="relative z-10 space-y-4">
                                    <Text size="lg" weight="semibold" className="text-white group-hover:text-purple-300 transition-colors">
                                        {lobby.name}
                                    </Text>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-300">Players</span>
                                        <span className="text-white font-medium">{lobby.players}</span>
                                    </div>

                                    <div className="pt-2">
                                        <Button
                                            size="sm"
                                            colorscheme="purpleToBlue"
                                            variant="solid"
                                            className="w-full group-hover:scale-105 transition-transform duration-300"
                                        >
                                            Join Lobby
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Lobby */}
            <div className="w-full max-w-2xl relative">
                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-8 shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 hover:scale-105 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10 animate-pulse"></div>

                    <div className="relative z-10 space-y-6">
                        <div className="text-center space-y-2">
                            <Text size="xl" weight="semibold" className="text-white">
                                Create a Lobby
                            </Text>
                            <div className="w- h-1 bg-gradient-to-r from-green-400 to-blue-400 mx-auto rounded-full"></div>
                        </div>

                        <div className="space-y-4">
                            <div className="relative">
                                <Input
                                    placeholder="Enter lobby name..."
                                    className="text-white bg-white/5 border-white/30 focus:border-purple-400 focus:ring-purple-400/50 placeholder-gray-400 transition-all duration-300 hover:bg-white/10"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                            </div>

                            <Button
                                colorscheme="greenToBlue"
                                variant="solid"
                                className="w-full text-lg py-3 hover:scale-105 transition-transform duration-300"
                            >
                                Create Lobby 🚀
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
                <Button
                    colorscheme="purpleToBlue"
                    variant="ghost"
                    size="md"
                    className="group hover:scale-110 transition-transform duration-300"
                >
                    <span className="group-hover:animate-spin inline-block mr-2">🔄</span>
                    Refresh Lobbies
                </Button>
            </div>
        </div>
    );
}
