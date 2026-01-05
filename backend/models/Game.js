// models/Game.js - Updated Game Model with pointsHistory
'use strict';

const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
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
    pointsHistory: {
        type: [Number],
        default: []
    }
}, { _id: false });

const gameSchema = new mongoose.Schema({
    lobbyId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Lobby'
    },
    players: [playerSchema],
    currentDealer: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
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
        ref: 'User',
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Game', gameSchema);