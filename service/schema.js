const client = require('../client/mongodb');

exports.find = async payload => {
   const { schemaIds } = payload;
   if (!schemaIds) {
      throw new Error('Missing schemaIds in request');
   }
   return { schemas: [await client.describeDoc(payload.requestContext.site_db_name, schemaIds[0])] };
}

exports.list = async payload => {
   const site_db_name = payload.requestContext.site_db_name;
   const schemasIds = await client.listCollectionIds(site_db_name);

   const schemas = schemasIds.map(schema => {
      return client.describeDoc(site_db_name, schema.id);
   });
   return { schemas: await Promise.all(schemas) };
}

exports.provision = async payload => {
   return client.listCollectionIds(payload.requestContext.site_db_name);
}