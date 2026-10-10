'use strict';

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const routes = require('./routes');
const config = require('./config');

// Strip query operators like { $ne: ... } from user input used in query filters (NoSQL injection)
mongoose.set('sanitizeFilter', true);

const app = express();

// Behind a reverse proxy, req.ip (used by the rate limits) must come from X-Forwarded-For
if (config.trustProxy) {
    app.set('trust proxy', /^\d+$/.test(config.trustProxy) ? Number(config.trustProxy) : config.trustProxy);
}

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
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Logging (path only: bodies contain passwords and query strings may contain session ids)
if (process.env.NODE_ENV !== 'test') {
    app.use((req, res, next) => {
        // Skip the healthcheck, which Docker calls every 30 seconds
        if (req.path !== '/health') {
            console.log(`${req.method} ${req.path}`);
        }
        next();
    });
}

// Mount all routes
app.use(routes);

// Error handling
app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    if (status >= 500) {
        console.error('Error:', err);
    }
    res.status(status).json({
        message: status >= 500 ? 'Internal Server Error' : err.message
    });
});

module.exports = app;
