'use strict';

class EventService {
    constructor() {
        this.clients = new Map();
        this.CONNECTION_TIMEOUT = 2 * 60 * 1000;
        this.HEARTBEAT_INTERVAL = 30000;
        this.cleanupTimer = null;

        this.startConnectionMonitoring();
    }

    startConnectionMonitoring() {
        this.cleanupTimer = setInterval(() => {
            this.cleanupStaleConnections();
        }, 60000);
    }

    cleanupStaleConnections() {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [gameId, clients] of this.clients.entries()) {
            const staleClients = Array.from(clients).filter(
                client => now - client.lastActivity > this.CONNECTION_TIMEOUT
            );

            staleClients.forEach(client => {
                console.log(`[EventService] Removing stale connection for game ${gameId}`);
                this.removeClient(gameId, client.res);
                cleanedCount++;
            });
        }

        if (cleanedCount > 0) {
            console.log(`[EventService] Cleaned up ${cleanedCount} stale connections`);
        }
    }

    addClient(gameId, res) {
        if (!this.clients.has(gameId)) {
            this.clients.set(gameId, new Set());
        }

        const clientObj = {
            res,
            lastActivity: Date.now(),
            heartbeatTimer: null
        };

        this.clients.get(gameId).add(clientObj);

        console.log(`[EventService] Client added to game ${gameId}. Total clients: ${this.clients.get(gameId).size}`);

        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        });

        this.safeWrite(clientObj, `data: ${JSON.stringify({ type: 'CONNECTED', gameId })}\n\n`);
        this.startHeartbeat(clientObj, gameId);

        res.on('close', () => {
            console.log(`[EventService] Client disconnected from game ${gameId}`);
            this.removeClient(gameId, res);
        });

        res.on('error', (err) => {
            console.error(`[EventService] Connection error for game ${gameId}:`, err.message);
            this.removeClient(gameId, res);
        });
    }

    startHeartbeat(clientObj, gameId) {
        clientObj.heartbeatTimer = setInterval(() => {
            if (!this.safeWrite(clientObj, ': heartbeat\n\n')) {
                this.removeClient(gameId, clientObj.res);
            } else {
                clientObj.lastActivity = Date.now();
            }
        }, this.HEARTBEAT_INTERVAL);
    }

    safeWrite(clientObj, data) {
        try {
            clientObj.res.write(data);
            return true;
        } catch (error) {
            console.error('[EventService] Error writing to client:', error.message);
            return false;
        }
    }

    removeClient(gameId, res) {
        const clients = this.clients.get(gameId);
        if (!clients) return;

        for (const clientObj of clients) {
            if (clientObj.res === res) {
                if (clientObj.heartbeatTimer) {
                    clearInterval(clientObj.heartbeatTimer);
                }

                clients.delete(clientObj);
                console.log(`[EventService] Client removed from game ${gameId}. Remaining clients: ${clients.size}`);

                if (clients.size === 0) {
                    this.clients.delete(gameId);
                    console.log(`[EventService] No more clients for game ${gameId}, removing game from map`);
                }
                break;
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

        const clientArray = Array.from(clients);

        clientArray.forEach(clientObj => {
            if (!this.safeWrite(clientObj, eventData)) {
                this.removeClient(gameId, clientObj.res);
            } else {
                clientObj.lastActivity = Date.now();
                console.log(`[EventService] Event sent successfully to a client`);
            }
        });
    }

    sendEventToAll(data) {
        this.clients.forEach((clients, gameId) => {
            this.sendEvent(gameId, data);
        });
    }

    shutdown() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }

        for (const clients of this.clients.values()) {
            for (const clientObj of clients) {
                if (clientObj.heartbeatTimer) {
                    clearInterval(clientObj.heartbeatTimer);
                }
            }
        }

        this.clients.clear();
    }
}

module.exports = new EventService();