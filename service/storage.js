const uuid = require('uuid').v4;
const client = require('../client/mongodb');


exports.find = async payload => {
   const query = { collectionName, filter, sort, skip, limit } = payload;
   if (!query.collectionName)
      throw new BadRequestError('Missing collectionName in request body')
   if (!query.skip && query.skip !== 0)
      throw new BadRequestError('Missing skip in request body')
   if (!query.limit) throw new BadRequestError('Missing limit in request body')

   const results = await client.query(query).toArray();
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

exports.get = async payload => {
   const { collectionName, itemId } = payload;
   if (!collectionName) throw new BadRequestError('Missing collectionName in request body');
   if (!itemId) throw new BadRequestError('Missing itemId in request body');

   const document = await client.get(collectionName, itemId);

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

exports.insert = async payload => {
   const { collectionName, item } = payload;
   if (!collectionName) throw new BadRequestError('Missing collectionName in request body');
   if (!item) throw new BadRequestError('Missing item in request body');

   if (!item._id) item._id = uuid();
   await client.insert(collectionName, extractDates(item));

   return { item: wrapDates(item) };
}

exports.update = async payload => {
   const { collectionName, item } = payload;
   if (!collectionName) throw new BadRequestError('Missing collectionName in request body');
   if (!item) throw new BadRequestError('Missing item in request body');

   await client.update(collectionName, extractDates(item));

   return { item: wrapDates(item) };
}

exports.remove = async payload => {
   const { collectionName, itemId } = payload;
   if (!collectionName) throw new BadRequestError('Missing collectionName in request body');
   if (!itemId) throw new BadRequestError('Missing itemId in request body');

   const item = await client.get(collectionName, itemId);
   await client.delete(collectionName, itemId);

   return { item: wrapDates(item) };
}

exports.count = async payload => {
   const { collectionName } = payload;
   if (!collectionName) throw new BadRequestError('Missing collectionName in request body');

   const results = await client.query({ collectionName: collectionName, limit: 1000, skip: 0, select: 'id' }).toArray();

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