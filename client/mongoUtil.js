const MongoClient = require('mongodb').MongoClient;
const mongoConfig = require('./mongodbConfig');
const uri = mongoConfig.URI;

module.exports = {
  getDb: (db_name, dbClient) => {
    try {
      return dbClient.db(db_name);
    } catch (e) {
      return e;
    }
  },
  getClient: () => {
    try {
      return new MongoClient(uri, { useUnifiedTopology: true }).connect();
    } catch (e) {
      return e;
    }
  },
};
