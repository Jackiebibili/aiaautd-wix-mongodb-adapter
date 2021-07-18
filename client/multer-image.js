const path = require('path');
const multer = require('multer');
const aws = require('aws-sdk');
const fs = require('fs');
const Storage = require('../service/storage');

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// contain label
const uploadImageLabel = (req, fileUrl, dbClient) => {
  const site_db_name = req.query.site_db_name;
  const caption = req.query.caption;
  const department = req.query.department;

  const newFile = {
    caption: caption,
    department: [department],
    filename: `${req.file.filename}${path.extname(req.file.originalname)}`,
    fileId: fileUrl,
    fileSize: req.file.size,
    fileLastModifiedDate: parseInt(req.body.mtime)
      ? new Date(parseInt(req.body.mtime))
      : new Date(),
  };

  return Storage.insert(
    {
      site_db_name,
      collectionName: 'file-label',
      item: newFile,
    },
    dbClient
  );
};

const uploadImage = (req, dbClient) => {
  aws.config.setPromisesDependency();
  aws.config.update({
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    accessKeyId: process.env.ACCESS_KEY_ID,
    region: process.env.REGION,
  });

  const s3 = new aws.S3();

  const params = {
    ACL: process.env.ACCESS_LEVEL,
    Bucket: process.env.BUCKET_NAME,
    Body: fs.createReadStream(req.file.path),
    Key: `file/${req.file.filename}-${req.file.originalname}`,
  };

  // upload files to aws.s3
  return s3
    .upload(params)
    .promise()
    .then((data) => {
      fs.unlinkSync(req.file.path); // Empty temp folder
      const locationUrl = data.Location; // file object public URL
      return uploadImageLabel(req, locationUrl, dbClient);
    });
};

/* if (err) {
  console.log('Error occured while trying to upload to S3 bucket', err);
} */

/*
const _storage = () => {
  return new GridFsStorage({
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
*/

// get into router, do things(find duplicate), then upload
module.exports = {
  upload: multer({ dest: 'temp/', limits: { fileSize: MAX_FILE_SIZE } }),
  uploadImage: uploadImage,
  MAX_FILE_SIZE: MAX_FILE_SIZE,
};
