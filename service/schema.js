const client = require('../client/mongodb');

exports.find = async (payload, dbClient) => {
  const { schemaIds } = payload;
  if (!schemaIds) {
    throw new Error('Missing schemaIds in request');
  }
  return {
    schemas: [
      await client.describeDoc(
        payload.requestContext.site_db_name,
        schemaIds[0],
        dbClient
      ),
    ],
  };
};

exports.list = async (payload, dbClient) => {
  const site_db_name = payload.requestContext.site_db_name;
  const schemasIds = await client.listCollectionIds(site_db_name, dbClient);

  const schemas = schemasIds
    .filter((schema) => {
      // skip file chunks' collections
      if (
        schema.id === 'fileUploads.chunks' ||
        schema.id === 'fileUploads.files'
      ) {
        return false;
      }
      return true;
    })
    .map((schema) => {
      return client.describeDoc(site_db_name, schema.id, dbClient);
    });
  return { schemas: await Promise.all(schemas) };
};

exports.provision = async (payload, dbClient) => {
  return client.listCollectionIds(
    payload.requestContext.site_db_name,
    dbClient
  );
};
