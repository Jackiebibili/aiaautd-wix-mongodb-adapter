const GridFSBucket = require('mongodb').GridFSBucket;

module.exports = {
  getGfs: (dbClient, site_name) => {
    const db_conn = dbClient.db(site_name);
    const gfs = new GridFSBucket(db_conn, {
      bucketName: 'fileUploads',
    });
    return gfs;
  },
};
