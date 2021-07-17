const express = require('express');
const imageRouter = express.Router();
const uuid = require('uuid').v4;
const mongodbUtil = require('./mongoUtil');
const BadRequestError = require('../model/error/bad-request');
const { MulterError } = require('multer');
const { uploadImage, upload } = require('./multer-image');

module.exports = (dbClient) => {
  /** Middleware used to validate non-empty site-name */
  imageRouter.use('/insert', async (req, res, next) => {
    const site_name = req.query.site_db_name;
    if (!site_name) {
      throw new BadRequestError('Missing request content');
    }
    next();
  });

  /** Middleware used to validate non-empty file caption in get or insert path */
  imageRouter.use('/insert', async (req, res, next) => {
    const caption = req.query.caption;
    if (!caption) {
      throw new BadRequestError('Missing request content');
    }
    next();
  });

  /** Upload and retrieve file from/to File collection */
  imageRouter.route('/insert').post(upload.single('file'), async (req, res) => {
    const site_name = req.query.site_db_name;
    const caption = req.query.caption;
    const department = req.query.department;
    const mongo = mongodbUtil.getDb(site_name, dbClient);

    const collRef = mongo.collection('file-label');

    // check duplicate filename (caption)
    const file = await collRef.findOne({ caption: caption });
    // caption matches
    if (file) {
      return res.status(409).json({
        success: false,
        message: 'File already exists',
      });
    }

    const newFile = await uploadImage(req, res, collRef);

    res.status(200).json({
      success: true,
      detail: newFile.ops,
    });
  });

  // imageRouter.route('/get')
  //    .post(async (req, res) => {
  //       const site_name = req.body.requestContext.site_db_name;
  //       const caption = req.body.caption;

  //       //establish connection to the collection, reusing the dbClient
  //       const mongo = mongodbUtil.getDb(site_name, dbClient);
  //       const collRef = mongo.collection('file-label');

  //       //find a file with the filename (caption)
  //       let file = await collRef.findOne({ caption: caption });
  //       //caption matches
  //       if (!file) {
  //          return res.status(200).json({
  //             success: false,
  //             message: 'File with provided caption does not exist'
  //          });
  //       }
  //       const fileId = file['fileId'];

  //       const gfs = gfsUtil.getGfs(dbClient, site_name);
  //       const files = await (await gfs.find({ "_id": ObjectId(fileId) })).toArray();
  //       if (!files || files.length === 0) {
  //          return res.status(200).json({
  //             success: true,
  //             message: 'No files available'
  //          });
  //       }
  //       res.contentType = files[0].contentType;
  //       gfs.openDownloadStream(ObjectId(fileId)).pipe(res);

  //       // files.map(file => {
  //       //    if (file.contentType === 'image/jpeg' || file.contentType === 'image/png' || file.contentType === 'image/svg') {
  //       //       file.isImage = true;
  //       //    } else {
  //       //       file.isImage = false;
  //       //    }
  //       // });

  //       // res.status(200).json({
  //       //    success: true,
  //       //    fileContent: files
  //       // })

  //    });

  return imageRouter;
};
