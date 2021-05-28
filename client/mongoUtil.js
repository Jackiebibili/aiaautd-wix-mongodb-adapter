const MongoClient = require('mongodb').MongoClient;
const mongoConfig = require('./mongodbConfig');
const uri = mongoConfig.URI;
const uri_concat_prefix = mongoConfig.URI_prefix;
const uri_concat_suffix = mongoConfig.URI_suffix;
let _db;
let _client;

module.exports = {
  getDb: (db_name, dbClient) => {
    try {
      _db = dbClient.db(db_name);
      return _db;
    } catch (e) {
      return e;
    }
  },
  getClient: () => {
    try {
      _client = new MongoClient(uri, { useUnifiedTopology: true }).connect();
      return _client;
    } catch (e) {
      return e;
    }
  },
  concatURI: (db_name) => {
    return uri_concat_prefix + db_name + uri_concat_suffix;
  },
};
