const express = require('express');
const imageRouter = express.Router();
const client = require('./mongodb');
const { uploadImage, upload, MAX_FILE_SIZE } = require('./multer-image');
const BadRequestError = require('../model/error/bad-request');
const AlreadyExistsError = require('../model/error/already-exists');

const fileLabelCollectionName = 'file-label';

module.exports = (dbClient) => {
  /** Middleware used to validate non-empty site-name */
  imageRouter.use('/insert', (req, res, next) => {
    const site_name = req.query.site_db_name;
    if (!site_name) {
      throw new BadRequestError('Missing request content');
    }
    next();
  });

  /** Middleware used to validate non-empty file caption in get or insert path */
  imageRouter.use('/insert', (req, res, next) => {
    const caption = req.query.caption;
    if (!caption) {
      throw new BadRequestError('Missing request content');
    }
    next();
  });

  /** Upload and retrieve file from/to File collection */
  imageRouter.route('/insert').post(upload.single('file'), (req, res) => {
    const site_name = req.query.site_db_name;
    const caption = req.query.caption;

    client
      .query(
        site_name,
        fileLabelCollectionName,
        {
          filter: { query: { caption: caption } },
          sort: {},
          skip: 0,
          limit: 1,
        },
        dbClient
      )
      .then((files) => {
        // check duplicate filename (caption)
        if (files.length > 0) {
          throw new AlreadyExistsError('File already exists');
        }
        // check file size
        if (req.file.size > MAX_FILE_SIZE) {
          throw new Error('File is too large. Please limit to 10MB');
        }
        return uploadImage(req, dbClient);
        // caption matches
      })
      .then((newFile) => {
        res.status(200).json({
          success: true,
          detail: newFile.item,
        });
      })
      .catch((err) => {
        if (err instanceof AlreadyExistsError) {
          return res.status(409).json({
            success: false,
            message: 'File already exists',
          });
        } else {
          return res.status(400).json({
            success: false,
            message: err.message,
          });
        }
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
