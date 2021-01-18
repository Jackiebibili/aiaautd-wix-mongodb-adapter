const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const items = require('./controller/items');
const schemas = require('./controller/schemas');
const provision = require('./controller/provision');
const mongoUtil = require('./client/mongoUtil');
const { wrapError, errorMiddleware } = require('./utils/error')
const authMiddleware = require('./utils/auth')
const imageRouter = require('./client/image-route');

const app = express();
const port = process.env.PORT || 8080;

/* Connect to the database */
let client;
(async function () {
   try {
      client = await mongoUtil.getClient();
      console.log('===MongoDB connected===');


      //parse request's json body
      //app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({
         extended: false
      }));
      //secretKey authentication
      //app.use(authMiddleware(client));

      //use multer middleware
      app.use('/file', imageRouter(client));

      //routes
      app.post('/schemas/find', wrapError(schemas.findSchemas, client))
      app.post('/schemas/list', wrapError(schemas.listSchemas, client))
      app.post('/data/find', wrapError(items.findItems, client))
      app.post('/data/get', wrapError(items.getItem, client))
      app.post('/data/insert', wrapError(items.insertItem, client))
      app.post('/data/update', wrapError(items.updateItem, client))
      app.post('/data/remove', wrapError(items.removeItem, client))
      app.post('/data/count', wrapError(items.countItems, client))
      app.post('/provision', wrapError(provision.provision, client))

      /* ignore direct access to the interface through GET*/
      /////////////////////////////////////////////////////////
      app.use('/static', express.static(path.join(__dirname, 'public')));
      app.get('/*', (req, res) => {
         res.sendFile(path.join(__dirname, 'public/index.html'));
      })
      /////////////////////////////////////////////////////////

      //handling errors
      app.use(errorMiddleware)

      app.listen(port, () => console.log('listening on port ' + port));
   } catch (e) {
      console.log(e);
   }
})();

