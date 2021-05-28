const gfsUtil = require('./gridfsUtil');
// const mongoUtil = require('./mongoUtil');
const { ObjectId } = require('mongodb');
// const NotFoundError = require('../model/error/not-found');
// const AlreadyExistsError = require('../model/error/already-exists');
const BadRequestError = require('../model/error/bad-request');

exports.delete = async (site_db_name, itemId, dbClient) => {
  // const mongo = await mongoUtil.getDb(site_db_name, dbClient);

  if (!ObjectId.isValid(itemId)) {
    throw new BadRequestError('file ID is invalid');
  }

  const gfs = gfsUtil.getGfs(dbClient, site_db_name);
  await gfs.delete(ObjectId(itemId));

  // success
  return {
    success: true,
  };
};
