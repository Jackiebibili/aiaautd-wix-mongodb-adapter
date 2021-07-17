const crypto = require('crypto');
const path = require('path');
const multer = require('multer'); // multer is object
const mongodbUtil = require('./mongoUtil');
const aws = require('aws-sdk');
const multerS3 = require('multer-s3');
const fs = require('fs');
const uuid = require('uuid').v4;

// contain label
const uploadImageLabel = (req, res, fileUrl, collRef) => {
  const caption = req.query.caption;
  const department = req.query.department;

  const newFile = {
    _id: uuid(),
    caption: caption,
    department: [department],
    filename: `${req.file.filename}${path.extname(req.file.originalname)}`,
    fileId: fileUrl,
    lastModifiedDate: new Date(parseInt(req.body.mtime)),
    lastActivityDate: new Date(),
    fileSize: req.file.size,
  };

  return collRef.insertOne(newFile);
};

const uploadImage = async (req, res, collRef) => {
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
  const upload = s3.upload(params);
  const data = await upload.promise();

  /* if (err) {
    console.log('Error occured while trying to upload to S3 bucket', err);
  } */

  if (data) {
    fs.unlinkSync(req.file.path); // Empty temp folder
    const locationUrl = data.Location;
    return await uploadImageLabel(req, res, locationUrl, collRef);
  }
};

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
  upload: multer({ dest: 'temp/', limits: { fieldSize: 25 * 1024 * 1024 } }),
  uploadImage: uploadImage,
};
