const BadRequestError = require('../model/error/bad-request')
const UnauthorizedError = require('../model/error/unauthorized')
const Storage = require('../service/storage')
const mongoUtil = require('../client/mongoUtil');
const uuid = require('uuid').v4;

//the secretKey is: KO0vTOO0uDdhAWGV
let _configuredSecretKey = process.env.SECRET_KEY || 'KO0vTOO0uDdhAWGV';

const extractPropertyFromSettings = (requestContext, propertyName) => {
   if (!requestContext) {
      throw new BadRequestError('Missing request context')
   }

   if (!requestContext.settings || !requestContext.settings[propertyName]) {
      throw new UnauthorizedError(`Missing ${propertyName} in request context`)
   }

   return requestContext.settings[propertyName];
};


const extractRequestContextProperty = (requestContext, propertyName) => {
   console.log(requestContext);
   if (!requestContext || !requestContext[propertyName]) {
      throw new UnauthorizedError(`Missing ${propertyName} in request context`)
   }

   return requestContext[propertyName];
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
   let site_name = extractPropertyFromSettings(req.body.requestContext, "site_db_name")
   const query = {
      collectionName: "site",
      site_db_name: "websites",
      filter: {
         fieldName: "site_db_name",
         value: site_name
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
            site_db_name: site_db_name,
            initial_accessed: new Date()
         }
      }
      await Storage.insert(body);
   } else if (!itemList.items[0].instanceId) {
      //put the instanceId after provision
      const instanceId = extractRequestContextProperty(req.body.requestContext, "instanceId");
      const updateItem = itemList.items[0];
      updateItem.instanceId = instanceId;
      await Storage.update({ site_db_name: "websites", collectionName: "site", item: updateItem });
   }
   return site_db_name;
}

module.exports = authMiddleware
