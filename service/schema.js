const client = require('../client/mongodb');

exports.find = async payload => {
   const { schemaIds } = payload;
   if (!schemaIds) {
      throw new Error('Missing schemaIds in request');
   }
   return { schemas: [await client.describeDoc(schemaIds[0])] };
}

exports.list = async payload => {
   const schemasIds = await client.listCollectionIds();

   const schemas = schemasIds.map(schema => {
      return client.describeDoc(schema.id);
   });
   return { schemas: await Promise.all(schemas) };
}

exports.provision = async payload => {
   return client.listCollectionIds();
}