const mongoose = require('mongoose');

const lobbyPlayerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    name: String
}, { _id: false });

const lobbySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    playerCount: {
        type: Number,
        default: 0
    },
    players: [lobbyPlayerSchema],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    gameId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Game'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Lobby', lobbySchema);