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
    // Everyone who ever joined; never shrinks, so private games stay in their history
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    // The lobby admin; passed on when they leave. Older lobbies fall back to createdBy.
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
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
    },
    archived: Boolean,
    isPrivate: {
        type: Boolean, default: false
    },
    accessCode: {
        type: String, unique: true, sparse: true
    },
});

module.exports = mongoose.model('Lobby', lobbySchema);