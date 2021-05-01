const NotFoundError = require('../model/error/not-found');
const AlreadyExistsError = require('../model/error/already-exists');
const mongoUtil = require('./mongoUtil');

exports.query = async (site_db_name, collectionName, query, dbClient) => {
   //get mongodb collection ref
   const mongo = await mongoUtil.getDb(site_db_name, dbClient);
   const collRef = mongo.collection(collectionName);

   return collRef.find(query.filter.query, query.filter.aggregate)
      .sort(query.sort.sort)
      .skip(parseInt(query.skip))
      .limit(parseInt(query.limit))
      .toArray(); //get a promise
}

exports.count = async (site_db_name, collectionName, query, dbClient) => {
   const mongo = await mongoUtil.getDb(site_db_name, dbClient);
   return mongo.collection(collectionName).countDocuments(query.filter.query);
}

exports.get = async (site_db_name, collectionName, itemId, dbClient) => {
   const mongo = await mongoUtil.getDb(site_db_name, dbClient);
   return mongo.collection(collectionName).findOne({ "_id": itemId });
}

exports.listCollectionIds = async (site_db_name, dbClient) => {
   const mongo = await mongoUtil.getDb(site_db_name, dbClient);
   return mongo.listCollections().toArray()
      .then(coll => coll.map(data => {
         return { id: data.name }
      }))
}

exports.delete = async (site_db_name, collectionName, itemId, dbClient) => {
   try {
      const mongo = await mongoUtil.getDb(site_db_name, dbClient);
      return await mongo.collection(collectionName).findOneAndDelete({ "_id": itemId })
   } catch (err) {
      //delete not found
      throw new NotFoundError("The deleted item is not found");
   }
}

exports.update = async (site_db_name, collectionName, item, dbClient, upsert = false) => {
   try {
      const mongo = await mongoUtil.getDb(site_db_name, dbClient);
      const old = await exports.get(site_db_name, collectionName, item._id, dbClient);
      return mongo.collection(collectionName).replaceOne({ "_id": item._id }, { ...old, ...item }, { upsert: upsert });
   } catch (err) {
      //update not found
      throw new NotFoundError("The updated item is not found");
   }
}

exports.insert = async (site_db_name, collectionName, item, dbClient) => {
   try {
      const mongo = await mongoUtil.getDb(site_db_name, dbClient);
      await mongo.collection(collectionName).insertOne(item);
   } catch (e) {
      //already exists
      throw new AlreadyExistsError("The inserted item is already in the database");
   }
}

const getFirstDoc = async (site_db_name, collectionName, dbClient) => {
   const mongo = await mongoUtil.getDb(site_db_name, dbClient);
   const collection = mongo.collection(collectionName);
   const doc = await collection.find({}).toArray();

   return typeof doc[0] === "undefined" ? {} : doc[0];   //guard for empty collection table
}

exports.describeDoc = async (site_db_name, collectionId, dbClient) => {

   const aDoc = await getFirstDoc(site_db_name, collectionId, dbClient)

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
         if (val instanceof Date) {
            return 'datetime'
         }
         if (val instanceof Array) {
            return 'array'
         }
      default:
         return type
   }
}
