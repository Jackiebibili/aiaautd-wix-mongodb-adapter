const Storage = require('../service/storage')

exports.getBlogEntry = async(req, res, next, dbClient) => {
   const getBlog = await Storage.find(req.body, dbClient);
   if(!getBlog.items) {
      //no items - return an empty array
      res.status(200).json(getBlog);
   }
   //restore the files info by id
   const fileIds = getBlog.items.map((item) => item.files);
   const fullFiles = fileIds.map((filesId) => {
      return getListOfItems(filesId, 'file-label', req.body.requestContext.site_db_name, dbClient);
   });
   //restore the leads info by id
   const leadIds = getBlog.items.map((item) => item.leads);
   const fullLeads = leadIds.map((leadsId) => {
      return getListOfItems(leadsId, 'officers', req.body.requestContext.site_db_name, dbClient);
   })
   const files = await Promise.all(fullFiles);
   const leads = await Promise.all(fullLeads);
   getBlog.items = getBlog.items.map((item, idx) => {
      return {...item, files: files[idx], leads: leads[idx]};
   });

   //return json response
   res.status(200).json(getBlog);
}

const getListOfItems = async (ids, collectionName, site_db_name, dbClient) => {
   const items = ids.map((id) => {
      return Storage.get({itemId: id, collectionName, site_db_name }, dbClient);
   });
   const results = await Promise.all(items);
   return results.map((item) => item.item);
}