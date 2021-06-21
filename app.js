const express = require('express');
const cors = require('cors');
// enviroment variable register
require('dotenv').config();
const path = require('path');
// const bodyParser = require('body-parser');
const items = require('./controller/items');
const schemas = require('./controller/schemas');
const provision = require('./controller/provision');
const blogs = require('./controller/blogs');
const files = require('./controller/files');
const mongoUtil = require('./client/mongoUtil');
const { wrapError, errorMiddleware } = require('./utils/error');
const authMiddleware = require('./utils/auth');
const fileRouter = require('./client/image-route');
const imageByIdRouter = require('./client/image-by-id-route');
const app = express();
const port = process.env.PORT || 8080;

/* Connect to the database */
let client;

(async function () {
  try {
    client = await mongoUtil.getClient();
    console.log('===MongoDB connected===');

    app.use(cors());
    // parse request's json body
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    // get images without authentication
    app.use('/file', imageByIdRouter(client));
    app.use('/file', fileRouter(client));

    /* ignore direct access to the interface through GET */
    /// //////////////////////////////////////////////////////
    app.use('/static', express.static(path.join(__dirname, 'public')));
    app.get('/*', (req, res) => {
      res.sendFile(path.join(__dirname, 'public/index.html'));
    });
    /// //////////////////////////////////////////////////////

    // secretKey authentication
    app.use(authMiddleware(client));

    // routes for gridfs operations (e.g. delete)
    app.post('/file/delete', wrapError(files.deleteOneFile, client));

    // new routes for BLOGS, specifically
    app.post('/data/blogs/find', wrapError(blogs.findBlogEntry, client));
    app.post('/data/blogs/get', wrapError(blogs.getBlogEntry, client));
    app.post('/data/blogs/update', wrapError(blogs.updateBlogEntry, client));
    // routes
    app.post('/schemas/find', wrapError(schemas.findSchemas, client));
    app.post('/schemas/list', wrapError(schemas.listSchemas, client));
    app.post('/data/find', wrapError(items.findItems, client));
    app.post('/data/get', wrapError(items.getItem, client));
    app.post('/data/insert', wrapError(items.insertItem, client));
    app.post('/data/update', wrapError(items.updateItem, client));
    app.post('/data/remove', wrapError(items.removeItem, client));
    app.post('/data/count', wrapError(items.countItems, client));
    app.post('/provision', wrapError(provision.provision, client));

    // handling errors
    app.use(errorMiddleware);

    app.listen(port, () => console.log('listening on port ' + port));
  } catch (e) {
    console.log(e);
  }
})();
