const aws = require('aws-sdk');
const client = require('../client/mongodb');
const DB_CONFIG = require('../constants/config');
const BadRequestError = require('../model/error/bad-request');

aws.config.setPromisesDependency();
aws.config.update({
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  accessKeyId: process.env.ACCESS_KEY_ID,
  region: process.env.REGION,
});

exports.deleteOneFile = (req, res, dbClient) => {
  const payload = req.body;
  const { collectionName, itemId } = payload;
  const site_db_name = DB_CONFIG.DATABASE_NAME.MAIN;
  if (!collectionName)
    throw new BadRequestError('Missing collectionName in request body');
  if (!itemId) throw new BadRequestError('Missing itemId in request body');
  if (!site_db_name)
    throw new BadRequestError('Missing siteName in request body');

  const s3 = new aws.S3();
  return client
    .delete(site_db_name, collectionName, itemId, dbClient)
    .then((deleteFileLabel) => {
      const param = {
        Bucket: process.env.BUCKET_NAME,
        Key: deleteFileLabel.s3Key,
      };
      return Promise.all([
        s3.deleteObject(param).promise(),
        Promise.resolve(deleteFileLabel),
      ]);
    })
    .then((data) => {
      res.status(200).json({
        item: data[1],
      });
    });

  /*
  // remove the file from gridfs
  if (file.value) {
    await gridfsBucket.delete(site_db_name, file.value.fileId, dbClient);
  } else {
    throw new NotFoundError('The deleted item is not found');
  }

  return {
    item: {
      ...file.value,
    },
  }; */
};
