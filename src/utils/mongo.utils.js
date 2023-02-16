const { MongoClient, ServerApiVersion, Collection } = require('mongodb');
require('dotenv').config();
const DB_URI = process.env.DB_URI;


function getMongoClient() {
    if(!process.env.DB_URI) {
        throw new Error('process.env.DB_URI is undefined');
    }

    const client = new MongoClient(DB_URI, { serverApi: ServerApiVersion.v1 });
    return client;
}

module.exports = { getMongoClient };