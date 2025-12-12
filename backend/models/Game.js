const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    name: String,
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    totalScore: {
        type: Number,
        default: 0
    },
    currentRoundScore: {
        type: Number,
        default: 0
    },
    hasSubmitted: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const gameSchema = new mongoose.Schema({
    lobbyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lobby',
        required: true
    },
    players: [playerSchema],
    currentDealer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    currentRound: {
        type: Number,
        default: 1
    },
    isFinished: {
        type: Boolean,
        default: false
    },
    winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Game', gameSchema);