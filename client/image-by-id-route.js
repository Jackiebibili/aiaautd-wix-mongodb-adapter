const express = require('express');
const imageRouter = express.Router();
const gfsUtil = require('./gridfsUtil');
const { ObjectId } = require('mongodb');

module.exports = (dbClient) => {
   imageRouter.route('/image/id')
      .get(async (req, res) => {
         const site_name = req.query.site_db_name;
         const id = req.query.id;

         const gfs = gfsUtil.getGfs(dbClient, site_name);
         const files = await (await gfs.find({ "_id": ObjectId(id) })).toArray();
         if (!files || files.length === 0) {
            return res.status(200).json({
               success: true,
               message: 'No files available'
            });
         }
         res.contentType = files[0].contentType;
         gfs.openDownloadStream(ObjectId(id)).pipe(res);
      });

   return imageRouter;
}
