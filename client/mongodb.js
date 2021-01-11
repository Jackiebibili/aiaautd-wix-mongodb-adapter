const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://admin:TQs5xcoaogp3wxDJ@cluster0.2hycd.mongodb.net/db0?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true });
let mongo;
const NotFoundError = require('../model/error/not-found');
const AlreadyExistsError = require('../model/error/already-exists');

const { parseFilter } = require('./support/filter-parser')
const { parseSort } = require('./support/sort-parser')
client.connect(err => {
   mongo = client.db("db0");
   console.log("MongoDB connected");
   //client.close();
});


exports.query = (query) => {
   const collRef = mongo.collection(query.collectionName);
   let fsQuery = parseSort(query.sort, collRef);
   //fsQuery = parseFilter(query.filter, fsQuery);
   if (query.filter.fieldName && query.filter.value) {
      return fsQuery.find({ [query.filter.fieldName]: query.filter.value },
         {
            limit: query.limit,
            skip: query.skip
         });
   } else {
      return fsQuery.find({},
         {
            limit: query.limit,
            skip: query.skip
         });
   }
}

exports.get = (collectionName, itemId) => {
   return mongo.collection(collectionName).findOne({ "_id": itemId });
}

exports.listCollectionIds = () => {
   return mongo.listCollections().toArray()
      .then(coll => coll.map(data => {
         return { id: data.name }
      }))
}

exports.delete = async (collectionName, itemId) => {
   try {
      await mongo.collection(collectionName).deleteOne({ "_id": itemId })

   } catch (err) {
      //delete not found
      throw err;
   }
}

exports.update = async (collectionName, item, upsert = true) => {
   try {
      await mongo.collection(collectionName).replaceOne({ "_id": item._id }, item, { upsert: upsert });
   } catch (err) {
      //update not found
      throw err;
   }
}

exports.insert = async (collectionName, item) => {
   try {
      await mongo.collection(collectionName).insertOne(item);
   } catch (e) {
      //already exists
      throw err;
   }
}

const getFirstDoc = async (collectionName) => {
   const collection = mongo.collection(collectionName);
   const doc = await collection.find({}).toArray();

   return doc[0];
}

exports.describeDoc = async (collectionId) => {

   const aDoc = await getFirstDoc(collectionId)

   return {
      displayName: collectionId,
      id: collectionId,
      allowedOperations: ["get", "find", "count", "update", "insert", "remove"],
      maxPageSize: 50,
      ttl: 3600,
      fields: jsonFieldsToCorvidFields(Object.entries(aDoc))
   }
}

const jsonFieldsToCorvidFields = columns => {
   return columns
      .map(field => {
         return {
            displayName: field[0],
            type: jsonValueTypeToCorvid(field[1]),
            queryOperators: [
               'eq',
               'lt',
               'gt',
               'hasSome',
               'and',
               'lte',
               'gte',
               'or',
               // 'not',
               // 'ne',
               'startsWith',
               'endsWith'
            ]
         }
      })
      .reduce((map, obj) => {
         map[obj.displayName] = obj
         return map
      }, {})
}

const jsonValueTypeToCorvid = val => {

   const type = typeof val;

   switch (type) {
      case 'string':
         return 'text'
      case 'object':
         if (val instanceof Firestore.Timestamp) {
            return 'datetime'
         }
      default:
         return type
   }
}
