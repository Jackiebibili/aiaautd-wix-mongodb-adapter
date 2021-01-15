let mongo;
const NotFoundError = require('../model/error/not-found');
const AlreadyExistsError = require('../model/error/already-exists');
const mongoUtil = require('./mongoUtil');
const { parseFilter } = require('./support/filter-parser')
const { parseSort } = require('./support/sort-parser')


exports.query = async (query) => {
   mongo = await mongoUtil.getDb(query.site_db_name);
   const collRef = mongo.collection(query.collectionName);
   let fsQuery = parseSort(query.sort, collRef);
   //fsQuery = parseFilter(query.filter, fsQuery);
   if (query.filter && query.filter.fieldName && query.filter.value) {
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

exports.get = async (site_db_name, collectionName, itemId) => {
   mongo = await mongoUtil.getDb(site_db_name);
   return mongo.collection(collectionName).findOne({ "_id": itemId });
}

exports.listCollectionIds = async (site_db_name) => {
   mongo = await mongoUtil.getDb(site_db_name);
   return mongo.listCollections().toArray()
      .then(coll => coll.map(data => {
         return { id: data.name }
      }))
}

exports.delete = async (site_db_name, collectionName, itemId) => {
   try {
      mongo = await mongoUtil.getDb(site_db_name);
      await mongo.collection(collectionName).deleteOne({ "_id": itemId })
   } catch (err) {
      //delete not found
      throw new NotFoundError("The deleted item is not found");
   }
}

exports.update = async (site_db_name, collectionName, item, upsert = true) => {
   try {
      mongo = await mongoUtil.getDb(site_db_name);
      await mongo.collection(collectionName).replaceOne({ "_id": item._id }, item, { upsert: upsert });
   } catch (err) {
      //update not found
      throw new NotFoundError("The updated item is not found");
   }
}

exports.insert = async (site_db_name, collectionName, item) => {
   try {
      mongo = await mongoUtil.getDb(site_db_name);
      await mongo.collection(collectionName).insertOne(item);
   } catch (e) {
      //already exists
      throw new AlreadyExistsError("The inserted item is already in the database");
   }
}

const getFirstDoc = async (site_db_name, collectionName) => {
   mongo = await mongoUtil.getDb(site_db_name);
   const collection = mongo.collection(collectionName);
   const doc = await collection.find({}).toArray();

   return typeof doc[0] === "undefined" ? {} : doc[0];   //guard for empty collection table
}

exports.describeDoc = async (site_db_name, collectionId) => {

   const aDoc = await getFirstDoc(site_db_name, collectionId)

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
