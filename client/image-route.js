const express = require('express');
const imageRouter = express.Router();
//const GridFSBucket = require("mongodb").GridFSBucket;
const File = require('../model/file.model');
const mongodbUtil = require('./mongoUtil');
const uploadImage = require('./multer-image');
const gfsUtil = require('./gridfsUtil');
const BadRequestError = require('../model/error/bad-request');
const { MulterError } = require('multer');
const { ObjectId } = require('mongodb');

module.exports = (dbClient) => {
   let site_name;

   /*Middleware used to get site-name */
   imageRouter.use('/', async (req, res, next) => {
      site_name = req.query.site_db_name;
      if (!site_name) {
         throw new BadRequestError("Missing request content");
      }
      next();
   });

   imageRouter.use('/insert', async (req, res, next) => {
      const caption = req.query.caption;
      if (!caption) {
         throw new BadRequestError("Missing request content");
      }
      next();
   });


   /**Upload and retrieve file from/to File collection */
   imageRouter.route('/insert')
      .post(async (req, res) => {
         //establish connection to the collection, reusing the dbClient
         const mongo = mongodbUtil.getDb(site_name, dbClient);
         const collRef = mongo.collection('file-label');

         //check duplicate filename (caption)
         let file = await collRef.findOne({ caption: req.query.caption });
         //caption matches
         if (file) {
            return res.status(200).json({
               success: false,
               message: 'File already exists'
            });
         }

         //unique filename/caption
         const uploadFile = uploadImage.upload(dbClient, site_name).single('file');
         uploadFile(req, res, async (err) => {
            if (err instanceof MulterError) {
               throw err;
            } else if (err) {
               throw Error("Unknow error thrown");
            }

            const newFile = new File({
               caption: req.query.caption,
               filename: req.file.filename,
               fileId: req.file.id
            });

            file = await collRef.insertOne(newFile);
            res.status(200).json({
               success: true,
               detail: file['ops']
            });
            //.catch(err => { res.status(500).json(err); })
         })
      })

   imageRouter.route('/get')
      .get(async (req, res) => {
         //validation
         const caption = req.query.caption;
         if (!caption) {
            throw new BadRequestError("Missing request content");
         }

         //establish connection to the collection, reusing the dbClient
         const mongo = mongodbUtil.getDb(site_name, dbClient);
         const collRef = mongo.collection('file-label');

         //find a file with the filename (caption)
         let file = await collRef.findOne({ caption: caption });
         //caption matches
         if (!file) {
            return res.status(200).json({
               success: false,
               message: 'File with provided caption does not exist'
            });
         }
         const fileId = file['fileId'];

         const gfs = gfsUtil.getGfs(dbClient, site_name);
         const files = await (await gfs.find({ "_id": ObjectId(fileId) })).toArray();
         if (!files || files.length === 0) {
            return res.status(200).json({
               success: true,
               message: 'No files available'
            });
         }
         res.contentType = files[0].contentType;
         // const fileObject = { files: [] };
         // files.map(file => {
         //    const obj = { contentType } = file;
         //    gfs.openDownloadStream(ObjectId(fileId)).pipe(obj.data);
         //    fileObject.files.push(obj);
         // })
         // res.status(200).json(fileObject);
         gfs.openDownloadStream(ObjectId(fileId)).pipe(res);

         // files.map(file => {
         //    if (file.contentType === 'image/jpeg' || file.contentType === 'image/png' || file.contentType === 'image/svg') {
         //       file.isImage = true;
         //    } else {
         //       file.isImage = false;
         //    }
         // });

         // res.status(200).json({
         //    success: true,
         //    fileContent: files
         // })
      });

   return imageRouter;
}
