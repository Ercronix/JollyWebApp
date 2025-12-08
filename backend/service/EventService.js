'use strict';

class EventService {
    constructor() {
        this.clients = new Map(); // gameId -> Set of response objects
    }

    addClient(gameId, res) {
        if (!this.clients.has(gameId)) {
            this.clients.set(gameId, new Set());
        }
        this.clients.get(gameId).add(res);

        console.log(`[EventService] Client added to game ${gameId}. Total clients: ${this.clients.get(gameId).size}`);

        // Setup headers for SSE - Fixed CORS for credentials
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': 'http://localhost:5173',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-session-id, Accept',
            'X-Accel-Buffering': 'no' // Disable buffering for proxies
        });

        // Send initial connection message
        res.write(`data: ${JSON.stringify({ type: 'CONNECTED', gameId })}\n\n`);

        // Remove client on connection close
        res.on('close', () => {
            console.log(`[EventService] Client disconnected from game ${gameId}`);
            this.removeClient(gameId, res);
        });
    }

    removeClient(gameId, res) {
        const clients = this.clients.get(gameId);
        if (clients) {
            clients.delete(res);
            console.log(`[EventService] Client removed from game ${gameId}. Remaining clients: ${clients.size}`);
            if (clients.size === 0) {
                this.clients.delete(gameId);
                console.log(`[EventService] No more clients for game ${gameId}, removing game from map`);
            }
        }
    }

    sendEvent(gameId, data) {
        const clients = this.clients.get(gameId);
        console.log(`[EventService] Attempting to send event to game ${gameId}. Event type: ${data.type}`);

        if (!clients) {
            console.log(`[EventService] No clients connected for game ${gameId}`);
            return;
        }

        console.log(`[EventService] Sending event to ${clients.size} client(s)`);
        const eventData = `data: ${JSON.stringify(data)}\n\n`;

        clients.forEach(client => {
            try {
                client.write(eventData);
                console.log(`[EventService] Event sent successfully to a client`);
            } catch (error) {
                console.error('[EventService] Error sending event to client:', error);
                this.removeClient(gameId, client);
            }
        });
    }

    sendEventToAll(data) {
        this.clients.forEach((clients, gameId) => {
            this.sendEvent(gameId, data);
        });
    }
}

module.exports = new EventService();