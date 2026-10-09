const { MongoMemoryServer } = require('mongodb-memory-server');

/**
 * Starts one in-memory MongoDB for the whole test run (or uses TEST_MONGODB_URI if set).
 * The returned function is the teardown.
 */
module.exports = async function setup({ provide }) {
    if (process.env.TEST_MONGODB_URI) {
        provide('mongoUri', process.env.TEST_MONGODB_URI);
        return;
    }

    const mongod = await MongoMemoryServer.create();
    provide('mongoUri', mongod.getUri());

    return async () => {
        await mongod.stop();
    };
};
