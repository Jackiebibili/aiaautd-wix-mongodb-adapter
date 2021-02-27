const uuid = require('uuid').v4;
const client = require('../client/mongodb');
const BadRequestError = require('../model/error/bad-request');
const { getFilters } = require('../client/query_support/filter-parser')
const { getSort } = require('../client/query_support/sort-parser')

exports.find = async (req, dbClient) => {
   const payload = req.body;
   const collectionName = payload.collectionName;
   const query = req.query;
   const site_db_name = payload.requestContext.site_db_name;
   
   //db identification
   if (!collectionName)
      throw new BadRequestError('Missing collectionName in request body')
   if (!site_db_name)
      throw new BadRequestError('Missing siteName in request body');

   //must-have skip and limit values
   if (!query.skip && query.skip != 0)
      throw new BadRequestError('Missing skip in request body')
   if (!query.limit) 
      throw new BadRequestError('Missing limit in request body')

   query.filter = getFilters(req.query);
   query.sort   = getSort(req.query);

   const [numDocs, results] = await Promise.all(
      [client.count(site_db_name, collectionName, query, dbClient),
       client.query(site_db_name, collectionName, query, dbClient)]);

   const enhanced = results.map(doc => {
      return wrapDates({
         _id: doc.id,
         ...doc
      })
   });

   return {
      items: enhanced,
      totalCount: enhanced.length,
      predicateMatches: numDocs,
      skip: parseInt(query.skip),
      limit: parseInt(query.limit),
   };
}

exports.get = async (payload, dbClient) => {
   const { collectionName, itemId } = payload;
   const site_db_name = payload.requestContext.site_db_name;
   if (!collectionName) throw new BadRequestError('Missing collectionName in request body');
   if (!itemId) throw new BadRequestError('Missing itemId in request body');
   if (!site_db_name) throw new BadRequestError('Missing siteName in request body');

   const document = await client.get(site_db_name, collectionName, itemId, dbClient);

   if (!document) {
      throw new Error(`item ${itemId} not found`);
   }

   return {
      item: wrapDates({
         _id: document.id,
         ...document
      })
   }
}

exports.insert = async (payload, dbClient) => {
   let { site_db_name, collectionName, item } = payload;
   site_db_name = payload.requestContext.site_db_name;
   if (!collectionName) throw new BadRequestError('Missing collectionName in request body');
   if (!item) throw new BadRequestError('Missing item in request body');
   if (!site_db_name) throw new BadRequestError('Missing siteName in request body');

   if (!item._id) item._id = uuid();
   await client.insert(site_db_name, collectionName, extractDates(item), dbClient);

   return { item: wrapDates(item) };
}

exports.update = async (payload, dbClient) => {
   let { site_db_name, collectionName, item } = payload;
   site_db_name = payload.requestContext.site_db_name;
   if (!collectionName) throw new BadRequestError('Missing collectionName in request body');
   if (!item) throw new BadRequestError('Missing item in request body');
   if (!site_db_name) throw new BadRequestError('Missing siteName in request body');

   await client.update(site_db_name, collectionName, extractDates(item), dbClient);

   return { item: wrapDates(item) };
}

exports.remove = async (payload, dbClient) => {
   const { collectionName, itemId } = payload;
   const site_db_name = payload.requestContext.site_db_name;
   if (!collectionName) throw new BadRequestError('Missing collectionName in request body');
   if (!itemId) throw new BadRequestError('Missing itemId in request body');
   if (!site_db_name) throw new BadRequestError('Missing siteName in request body');

   const item = await client.get(site_db_name, collectionName, itemId, dbClient);
   await client.delete(site_db_name, collectionName, itemId, dbClient);

   return { item: wrapDates(item) };
}

exports.count = async (req, dbClient) => {
   const payload = req.body;
   const { collectionName } = payload;
   const query = req.query;
   const site_db_name = payload.requestContext.site_db_name;

   if (!collectionName) throw new BadRequestError('Missing collectionName in request body');
   if (!site_db_name) throw new BadRequestError('Missing siteName in request body');

   query.filter = getFilters(req.query);

   const results = await client.count(site_db_name, collectionName, query, dbClient);

   return { totalCount: results };
}


const extractDates = item => {
   Object.keys(item).map(key => {
      const value = item[key];
      if (value === null) return;

      const reISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/;
      if (typeof value === 'string') {
         const re = reISO.exec(value);
         if (re) {
            item[key] = new Date(value);
         }
      }
      //if wrapped in the object, accessed by the name `$date`
      if (typeof value === 'object' && '$date' in value) {
         item[key] = new Date(value['$date']);
      }
   })

   return item

}

const wrapDates = item => {
   Object.keys(item)
      .map(key => {
         const value = item[key];
         if (value instanceof Date) {
            item[key] = { $date: item[key].toString() }
         }
      })

   return item;
}