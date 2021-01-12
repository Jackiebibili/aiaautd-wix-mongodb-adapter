const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://admin:TQs5xcoaogp3wxDJ@cluster0.2hycd.mongodb.net/websites?retryWrites=true&w=majority";
var _db;
module.exports = {
   getDb: async (site_name) => {
      try {
         _db = await (await MongoClient.connect(uri, { useUnifiedTopology: true })).db(site_name);
         return _db;
      } catch (e) {
         return e;
      }
   }
}