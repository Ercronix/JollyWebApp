'use strict';

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const routes = require('./routes');
const connectDB = require("./config/database");

const serverPort = 3501;
const app = express();

const allowedOrigins = [
    'http://localhost:3500', // dev frontend (Docker)
    'http://localhost:5173', // dev frontend (Vite)
    'http://localhost:3500', // dev frontend
    'http://127.0.0.1:3500',
    'http://jolly.timmornhinweg.de',
    'https://jolly.timmornhinweg.de', // production frontend
];

// Simpler CORS for development
if (process.env.NODE_ENV === 'development') {
    app.use(cors({
        origin: true, // Allow all origins in development
        credentials: true,
        methods: ['GET','POST','PUT','DELETE','OPTIONS','PATCH'],
        allowedHeaders: ['Content-Type','Authorization','x-session-id','Accept'],
        exposedHeaders: ['Set-Cookie'],
        maxAge: 86400
    }));
} else {
    // Strict CORS for production
    app.use(cors({
        origin: function(origin, callback) {
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            console.log('REJECTED origin:', origin);
            return callback(null, false);
        },
        credentials: true,
        methods: ['GET','POST','PUT','DELETE','OPTIONS','PATCH'],
        allowedHeaders: ['Content-Type','Authorization','x-session-id','Accept'],
        exposedHeaders: ['Set-Cookie'],
        maxAge: 86400
    }));
}

// Body + cookies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`, 'Body:', req.body);
    next();
});

connectDB();

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
