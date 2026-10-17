'use strict';

const http = require('http');
const mongoose = require('mongoose');
const app = require('./app');
const connectDB = require('./config/database');
const EventService = require('./service/EventService');
const LobbiesService = require('./service/LobbiesService');
const config = require('./config');

const serverPort = 3501;

connectDB();

const server = http.createServer(app).listen(serverPort, () => {
    console.log(`Server is listening on port ${serverPort}`);
});

// Issue #49: archive games nobody touched for a while, at startup and then periodically
function archiveStaleLobbies() {
    LobbiesService.archiveStaleLobbies().catch(error => {
        console.error('[Server] Archiving stale lobbies failed:', error);
    });
}
archiveStaleLobbies();
const staleCheckTimer = setInterval(archiveStaleLobbies, config.game.staleCheckIntervalMs);

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled promise rejection:', reason);
});

async function shutdown(signal) {
    console.log(`${signal} received, shutting down`);
    clearInterval(staleCheckTimer);
    EventService.shutdown();
    server.close();
    try {
        await mongoose.connection.close();
    } finally {
        process.exit(0);
    }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
