'use strict';

const path = require('path');
const http = require('http');
const cors = require('cors');
const express = require('express');
const cookieParser = require('cookie-parser');
const oas3Tools = require('oas3-tools');

const serverPort = 8080;

const app = express();

// 1. CORS must come first
const corsOptions = {
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id', 'Accept'],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// 2. Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Cookie parser
app.use(cookieParser());

// 4. Request logging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`, 'Body:', req.body);
    next();
});

// 5. NOW configure oas3-tools
const options = {
    routing: {
        controllers: path.join(__dirname, './controllers')
    },
};

console.log('Controllers path:', path.join(__dirname, './controllers'));

// Test if controller can be loaded
try {
    const DefaultController = require('./controllers/Default');
    console.log('Default controller loaded, methods:', Object.keys(DefaultController));

    // Manually add all routes
    // User routes
    app.get('/users/me', DefaultController.getCurrentUserGET);
    app.post('/users/login', DefaultController.loginUserPOST);
    app.post('/users/logout', DefaultController.logoutUserPOST);

    // Lobby routes
    app.get('/api/lobbies', DefaultController.listLobbiesGET);
    app.post('/api/lobbies', DefaultController.createLobbyPOST);
    app.post('/api/lobbies/:lobbyId/join', DefaultController.joinLobbyPOST);

    // Game routes
    app.get('/api/games/:gameId', DefaultController.getGameStateGET);
    app.post('/api/games/:gameId/submitScore', DefaultController.submitScorePOST);
    app.post('/api/games/:gameId/nextRound', DefaultController.nextRoundPOST);
    app.post('/api/games/:gameId/reorderPlayers', DefaultController.reorderPlayersPOST);
    app.post('/api/games/:gameId/resetRound', DefaultController.resetRoundPOST);

    app.get('/api/games/:gameId/events', DefaultController.subscribeToGameEventsGET);

    // Admin routes
    app.post('/admin/games/:gameId/forceNextRound', DefaultController.forceNextRoundPOST);

    console.log('Manual routes added');
} catch (e) {
    console.error('Failed to load Default controller:', e.message);
}

const expressAppConfig = oas3Tools.expressAppConfig(
    path.join(__dirname, 'api/openapi.yaml'),
    options
);

// Get the oas3-tools middleware and apply it
const oas3Middleware = expressAppConfig.getApp();

console.log('OAS3 middleware loaded');

// Apply OAS middleware to routes
app.use(oas3Middleware);

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error'
    });
});

// Start server
http.createServer(app).listen(serverPort, function () {
    console.log('Server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
    console.log('Swagger-ui is available on http://localhost:%d/docs', serverPort);
});