import { Button } from "@/presentation/components/Button";
import { Input } from "@/presentation/components/input";
import { Text } from "@/presentation/components/Text";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useGameViewModel, type GameSearchParams } from "@/presentation/viewModels/GameViewModel";
import {MainLayout} from "@/presentation/layout/MainLayout";


export function GamePage() {
    const navigate = useNavigate();
    const searchParams = useSearch({ from: '/Game' }) as GameSearchParams;
    const { gameState, viewModel } = useGameViewModel(searchParams);

    const handleLeaveLobby = () => {
        navigate({ to: "/lobby" });
    };

    const gameStats = viewModel.getGameStats();
    const currentDealer = viewModel.getCurrentDealer();

    return (
        <div className="min-h-screen relative overflow-hidden">
        <MainLayout>

            {/* Content */}
            <div className="relative z-10 container mx-auto px-4 py-6">
                <div className="flex flex-col gap-6 max-w-4xl mx-auto">

                    {/* Header */}
                    <div className="text-center space-y-4 animate-in fade-in duration-1000">
                        <Text
                            as="h1"
                            size="3xl"
                            weight="bold"
                            className="bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent text-3xl md:text-4xl lg:text-5xl"
                        >
                            {searchParams.lobbyName || "Card Game"}
                        </Text>
                        <div className="flex justify-center items-center gap-4 flex-wrap">
                            <Text size="lg" className="text-gray-300">
                                Round {gameStats.currentRound}
                            </Text>
                            <Text size="lg" className="text-yellow-300 flex items-center gap-2">
                                🃏 Dealer: {currentDealer?.name}
                            </Text>
                        </div>
                    </div>

                    {/* Round Status */}
                    <div className="text-center">
                        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20">
                            <div className={`w-3 h-3 rounded-full ${gameState.allPlayersSubmitted ? 'bg-green-400' : 'bg-orange-400'} animate-pulse`}></div>
                            <Text className="text-white font-medium">
                                {gameState.allPlayersSubmitted
                                    ? "✅ All players submitted - Ready for next round!"
                                    : `⏳ Waiting for scores (${gameStats.submittedProgress})`
                                }
                            </Text>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-wrap justify-center gap-3">
                        <Button
                            colorscheme="purpleToBlue"
                            variant="solid"
                            size="md"
                            onClick={viewModel.toggleReorderMode}
                            className="hover:scale-105 transition-transform duration-300"
                        >
                            {gameState.showReorderMode ? "👁️ View Mode" : "🔧 Reorder Players"}
                        </Button>

                        {gameState.allPlayersSubmitted && (
                            <Button
                                colorscheme="greenToBlue"
                                variant="solid"
                                size="md"
                                onClick={viewModel.handleNextRound}
                                className="hover:scale-105 transition-transform duration-300 animate-pulse"
                            >
                                🎯 Next Round
                            </Button>
                        )}

                        <Button
                            colorscheme="cyanToBlue"
                            variant="outline"
                            size="md"
                            onClick={viewModel.handleResetRound}
                            className="hover:scale-105 transition-transform duration-300"
                        >
                            🔄 Reset Round
                        </Button>

                        <Button
                            colorscheme="pinkToOrange"
                            variant="solid"
                            size="md"
                            onClick={handleLeaveLobby}
                            className="hover:scale-105 transition-transform duration-300"
                        >
                            🚪 Leave Game
                        </Button>
                    </div>

                    {/* Players List */}
                    <div className="space-y-4">
                        <div className="text-center mb-6">
                            <div className="w-32 h-1 bg-gradient-to-r from-purple-400 to-blue-400 mx-auto rounded-full"></div>
                        </div>

                        <div className="space-y-3">
                            {gameState.players.map((player, index) => (
                                <div
                                    key={player.id}
                                    draggable={gameState.showReorderMode}
                                    onDragStart={(e) => viewModel.handleDragStart(e, index)}
                                    onDragOver={viewModel.handleDragOver}
                                    onDrop={(e) => viewModel.handleDrop(e, index)}
                                    className={`group relative overflow-hidden rounded-2xl backdrop-blur-xl border p-4 shadow-lg transition-all duration-300 animate-in slide-in-from-left-6 ${
                                        player.hasSubmitted
                                            ? 'bg-green-500/10 border-green-500/30 shadow-green-500/25'
                                            : 'bg-white/10 border-white/20 hover:shadow-purple-500/25'
                                    } ${
                                        index === gameState.currentDealer
                                            ? 'ring-2 ring-yellow-400 bg-yellow-500/5'
                                            : ''
                                    } ${
                                        gameState.showReorderMode ? 'cursor-move hover:scale-102' : ''
                                    }`}
                                    style={{
                                        animationDelay: `${index * 100}ms`,
                                    }}
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        {/* Player Info */}
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/20 border border-purple-300/30 font-bold text-lg text-white">
                                                {index + 1}
                                            </div>

                                            <div>
                                                <Text size="lg" weight="semibold" className="text-white flex items-center gap-2">
                                                    {player.name}
                                                    {index === gameState.currentDealer && <span className="text-yellow-400">🃏</span>}
                                                    {player.hasSubmitted && <span className="text-green-400">✅</span>}
                                                    {gameState.showReorderMode && <span className="text-gray-400 text-sm">🔗</span>}
                                                </Text>
                                                <div className="flex items-center gap-4 text-sm">
                                                    <Text className="text-gray-400">
                                                        Total: <span className="text-white font-semibold">{player.totalScore}</span>
                                                    </Text>
                                                    {player.currentRoundScore !== null && (
                                                        <Text className="text-blue-300">
                                                            This Round: <span className="font-semibold">{player.currentRoundScore}</span>
                                                        </Text>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Score Input */}
                                        {!gameState.showReorderMode && !player.hasSubmitted && (
                                            <div className="flex items-center gap-3">
                                                <Input
                                                    type="number"
                                                    placeholder="Score"
                                                    value={gameState.tempScores[player.id] || ''}
                                                    onChange={(e) => viewModel.handleScoreInput(player.id, e.target.value)}
                                                    className="w-20 text-center text-white bg-white/5 border-white/30 focus:border-purple-400 placeholder-gray-400"
                                                />
                                                <Button
                                                    size="sm"
                                                    colorscheme="greenToBlue"
                                                    variant="solid"
                                                    onClick={() => viewModel.handleSubmitScore(player.id)}
                                                    disabled={!viewModel.canSubmitScore(player.id)}
                                                    className="hover:scale-110 transition-transform disabled:opacity-50"
                                                >
                                                    Submit
                                                </Button>
                                            </div>
                                        )}

                                        {!gameState.showReorderMode && player.hasSubmitted && (
                                            <div className="text-right">
                                                <Text size="xl" weight="bold" className="text-green-300">
                                                    {player.currentRoundScore}
                                                </Text>
                                                <Text size="sm" className="text-green-400">
                                                    submitted
                                                </Text>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Game Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
                            <Text size="xl" weight="bold" className="text-purple-300">
                                {gameStats.currentRound}
                            </Text>
                            <Text size="sm" className="text-gray-400">Current Round</Text>
                        </div>

                        <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
                            <Text size="xl" weight="bold" className="text-blue-300">
                                {gameStats.submittedProgress}
                            </Text>
                            <Text size="sm" className="text-gray-400">Submitted</Text>
                        </div>

                        <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
                            <Text size="xl" weight="bold" className="text-yellow-300">
                                {gameStats.currentDealerName?.split(' ')[1] || gameStats.currentDealerName}
                            </Text>
                            <Text size="sm" className="text-gray-400">Current Dealer</Text>
                        </div>

                        <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
                            <Text size="xl" weight="bold" className="text-green-300">
                                {gameStats.highestTotalScore}
                            </Text>
                            <Text size="sm" className="text-gray-400">Highest Total</Text>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="text-center mt-6 p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
                        <Text className="text-gray-300 text-sm">
                            {gameState.showReorderMode
                                ? "🔧 Drag and drop players to change turn order. The dealer position will adjust automatically."
                                : gameState.allPlayersSubmitted
                                    ? "🎯 All scores submitted! Click 'Next Round' to continue and advance the dealer."
                                    : "📝 Enter your round score and click Submit. The dealer shuffles cards this round."
                            }
                        </Text>
                    </div>
                </div>
            </div>
            </MainLayout>
        </div>

    );
}