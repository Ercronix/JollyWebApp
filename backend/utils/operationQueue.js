'use strict';

/**
 * Runs async operations one at a time per key (e.g. per game or lobby), so
 * read-modify-write cycles on the same document never interleave.
 * Only serializes within this process, which is fine for a single backend instance.
 */
class OperationQueue {
    constructor(name) {
        this.name = name;
        this.tails = new Map();
    }

    run(key, operation) {
        // ObjectIds are distinct objects, so always key by the string form
        const id = key.toString();
        const previous = this.tails.get(id) || Promise.resolve();
        const result = previous.then(() => operation());

        // The stored tail must never stay rejected, otherwise one failed operation
        // makes every later operation for this key fail. Callers still get the rejection.
        const tail = result.then(() => {}, err => {
            console.error(`[${this.name}] Operation error for ${id}:`, err.message || err);
        }).finally(() => {
            if (this.tails.get(id) === tail) {
                this.tails.delete(id);
            }
        });
        this.tails.set(id, tail);

        return result;
    }

    settled() {
        return Promise.allSettled(Array.from(this.tails.values()));
    }
}

module.exports = OperationQueue;
