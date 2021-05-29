const GridFsStorage = require('multer-gridfs-storage');
const crypto = require('crypto');
const path = require('path');
const multer = require('multer');
const mongodbUtil = require('./mongoUtil');
const _storage = (dbClient, site_name) => {
  const db = mongodbUtil.getDb(site_name, dbClient);
  return new GridFsStorage({
    // url: mongodbUtil.concatURI(site_name),
    db: db, // use db connection
    client: dbClient,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename =
            buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: 'fileUploads',
          };
          resolve(fileInfo);
        });
      });
    },
  });
};

module.exports = {
  upload: (dbClient, site_name) => {
    return multer({ storage: _storage(dbClient, site_name) });
  },
};
