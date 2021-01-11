const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://admin:TQs5xcoaogp3wxDJ@cluster0.2hycd.mongodb.net/db0?retryWrites=true&w=majority";
var _db;
module.exports = {
   getDb: async () => {
      try {
         _db = await (await MongoClient.connect(uri, { useUnifiedTopology: true })).db("db0");
         return _db;
      } catch (e) {
         return e;
      }
   }
}