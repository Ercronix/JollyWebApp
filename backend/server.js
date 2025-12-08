'use strict';

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const routes = require('./routes');

const serverPort = 8080;
const app = express();

// CORS
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id', 'Accept'],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 86400
}));

// Body + cookies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`, 'Body:', req.body);
    next();
});

// Mount all routes
app.use(routes);

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error'
    });
});

http.createServer(app).listen(serverPort, () => {
    console.log(`Server is listening on port ${serverPort}`);
});
