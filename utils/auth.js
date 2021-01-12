const BadRequestError = require('../model/error/bad-request')
const UnauthorizedError = require('../model/error/unauthorized')
const Storage = require('../service/storage')
const mongoUtil = require('../client/mongoUtil');
const uuid = require('uuid').v4;

let _configuredSecretKey = process.env.SECRET_KEY || 'wix-big-secret';

const extractPropertyFromSettings = (requestContext, propertyName) => {
   if (!requestContext) {
      throw new BadRequestError('Missing request context')
   }

   if (!requestContext.settings || !requestContext.settings[propertyName]) {
      throw new UnauthorizedError(`Missing ${propertyName} in request context`)
   }

   return requestContext.settings[propertyName];
};

const extractInstanceId = (requestContext) => {
   if (!requestContext || !requestContext.instanceId) {
      throw new UnauthorizedError(`Missing ${propertyName} in request context`)
   }

   return requestContext.instanceId;
};



const authMiddleware = async (req, _, next) => {
   const secretKey = extractPropertyFromSettings(req.body.requestContext, "secretKey")

   if (_configuredSecretKey !== secretKey) {
      throw new UnauthorizedError('Provided secret key does not match')
   }

   //validation of secretKey passes

   //validate the site's instanceId
   req.body.requestContext.site_db_name = await setDatabaseName(req);

   next()
};

const setDatabaseName = async (req) => {
   const instanceId = extractInstanceId(req.body.requestContext)
   let site_name = extractPropertyFromSettings(req.body.requestContext, "site_db_name")
   const query = {
      collectionName: "site",
      site_db_name: "websites",
      filter: {
         fieldName: "instanceId",
         value: instanceId
      },
      sort: null,
      skip: 0,
      limit: 1
   }
   let site_db_name;
   const itemList = await Storage.find(query);
   if (itemList.totalCount == 0 || !(site_db_name = itemList.items[0].site_db_name)) {
      site_db_name = site_name;
      //create an empty collection
      await Storage.insert({ site_db_name: site_db_name, collectionName: "collection0", item: { _id: uuid() } });

      //save as a new site
      const body = {
         site_db_name: "websites",
         collectionName: "site",
         item: {
            _id: uuid(),
            instanceId: instanceId,
            site_db_name: site_db_name,
            initial_accessed: new Date()
         }
      }
      Storage.insert(body);   //async insert
   }
   return site_db_name;
}

module.exports = authMiddleware
