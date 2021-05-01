const gridfsBucket = require('../client/gridfsBucket');
//const Storage = require('./storage');
const client = require('../client/mongodb');
const NotFoundError = require('../model/error/not-found');

exports.deleteOneFile = async (payload, dbClient) => {
   const { collectionName, itemId } = payload;
   const site_db_name = payload.requestContext.site_db_name;
   if (!collectionName) throw new BadRequestError('Missing collectionName in request body');
   if (!itemId) throw new BadRequestError('Missing itemId in request body');
   if (!site_db_name) throw new BadRequestError('Missing siteName in request body');

   //remove file label
   //get the file ID
   const file = await client.delete(site_db_name, collectionName, itemId, dbClient);
   //remove the file from gridfs
   if (file.value) {
      await gridfsBucket.delete(site_db_name, file.value.fileId, dbClient);
   } else {
      throw new NotFoundError("The deleted item is not found");
   }

   return {
      item: {
         ...file.value
      }
   };
}