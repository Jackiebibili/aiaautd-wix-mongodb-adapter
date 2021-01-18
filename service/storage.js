const uuid = require('uuid').v4;
const client = require('../client/mongodb');
const BadRequestError = require('../model/error/bad-request');

exports.find = async (payload, dbClient) => {
   const query = { collectionName, filter, sort, skip, limit } = payload;
   query.site_db_name = payload.requestContext ? payload.requestContext.site_db_name : null || query.site_db_name;
   if (!query.collectionName)
      throw new BadRequestError('Missing collectionName in request body')
   if (!query.skip && query.skip !== 0)
      throw new BadRequestError('Missing skip in request body')
   if (!query.limit) throw new BadRequestError('Missing limit in request body')
   if (!query.site_db_name) {
      throw new BadRequestError('Missing siteName in request body');
   }

   const results = await (await (client.query(query, dbClient))).toArray();
   const enhanced = results.map(doc => {
      return wrapDates({
         _id: doc.id,
         ...doc
      })
   });

   return {
      items: enhanced,
      totalCount: enhanced.length
   };
}

exports.get = async (payload, dbClient) => {
   const { collectionName, itemId } = payload;
   const site_db_name = payload.requestContext.site_db_name;
   if (!collectionName) throw new BadRequestError('Missing collectionName in request body');
   if (!itemId) throw new BadRequestError('Missing itemId in request body');
   if (!site_db_name) throw new BadRequestError('Missing siteName in request body');

   const document = await client.get(site_db_name, collectionName, itemId, dbClient);

   if (!document.exists) {
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
   site_db_name = payload.requestContext ? payload.requestContext.site_db_name : null ||
      site_db_name;
   if (!collectionName) throw new BadRequestError('Missing collectionName in request body');
   if (!item) throw new BadRequestError('Missing item in request body');
   if (!site_db_name) throw new BadRequestError('Missing siteName in request body');

   if (!item._id) item._id = uuid();
   await client.insert(site_db_name, collectionName, extractDates(item), dbClient);

   return { item: wrapDates(item) };
}

exports.update = async (payload, dbClient) => {
   let { site_db_name, collectionName, item } = payload;
   site_db_name = payload.requestContext ? payload.requestContext.site_db_name : null ||
      site_db_name;
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

   const item = await client.get(site_db_name, collectionName, itemId);
   await client.delete(site_db_name, collectionName, itemId, dbClient);

   return { item: wrapDates(item) };
}

exports.count = async (payload, dbClient) => {
   const { collectionName } = payload;
   const site_db_name = payload.requestContext.site_db_name;
   if (!collectionName) throw new BadRequestError('Missing collectionName in request body');
   if (!site_db_name) throw new BadRequestError('Missing siteName in request body');

   const results = await (await client.query({ collectionName: collectionName, site_db_name: site_db_name, limit: 1000, skip: 0, select: 'id' }, dbClient)).toArray();

   return {
      totalCount: results.length
   };
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