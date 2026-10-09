'use strict';

const http = require('http');
const mongoose = require('mongoose');
const app = require('./app');
const connectDB = require('./config/database');
const EventService = require('./service/EventService');

const serverPort = 3501;

connectDB();

const server = http.createServer(app).listen(serverPort, () => {
    console.log(`Server is listening on port ${serverPort}`);
});

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled promise rejection:', reason);
});

async function shutdown(signal) {
    console.log(`${signal} received, shutting down`);
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
