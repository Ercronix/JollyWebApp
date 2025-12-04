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

        // Setup headers for SSE
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        });

        // Send initial connection message
        res.write(`data: ${JSON.stringify({ type: 'CONNECTED', gameId })}\n\n`);

        // Remove client on connection close
        res.on('close', () => {
            this.removeClient(gameId, res);
        });
    }

    removeClient(gameId, res) {
        const clients = this.clients.get(gameId);
        if (clients) {
            clients.delete(res);
            if (clients.size === 0) {
                this.clients.delete(gameId);
            }
        }
    }

    sendEvent(gameId, data) {
        const clients = this.clients.get(gameId);
        if (!clients) {
            return;
        }

        const eventData = `data: ${JSON.stringify(data)}\n\n`;

        clients.forEach(client => {
            try {
                client.write(eventData);
            } catch (error) {
                console.error('Error sending event to client:', error);
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