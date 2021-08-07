const uuid = require('uuid').v4;
const Storage = require('../service/storage');
const truncatedPureBlogCollection = 'truncated-pure-blog';
const DB_CONFIG = require('../constants/config');

const getPlainText = (delta) => {
  return delta
    .reduce((text, obj) => {
      if (typeof obj.insert === 'string') {
        return text + obj.insert;
      }
      return text + ' ';
    }, '')
    .trim();
};

const updateTruncatedPureBlog = async (req, dbClient) => {
  const payload = req.body;
  const id = payload.item._id;
  const res = await Storage.get(
    {
      site_db_name: DB_CONFIG.DATABASE_NAME.MAIN,
      collectionName: payload.collectionName,
      itemId: id,
    },
    dbClient
  );
  const previewId = res.item.previewId;
  const title = payload.item.title || res.item.title;
  const delta = payload.item.delta || res.item.delta;
  const plainText = delta ? getPlainText(delta.ops) : '';
  // update the truncated content
  return Storage.update(
    {
      site_db_name: DB_CONFIG.DATABASE_NAME.MAIN,
      collectionName: truncatedPureBlogCollection,
      item: { _id: previewId, title, text: plainText },
    },
    dbClient
  );
};

const initTruncatedPureBlog = (req, newId, dbClient) => {
  return Storage.insert(
    {
      site_db_name: req.body.requestContext.site_db_name,
      collectionName: truncatedPureBlogCollection,
      item: { _id: newId, title: '', text: '' },
    },
    dbClient
  );
};

exports.updatePureBlogEntry = async (req, res, next, dbClient) => {
  const updateResult = await Promise.all([
    updateTruncatedPureBlog(req, dbClient),
    Storage.update(req.body, dbClient),
  ]);
  res.status(200).json(updateResult[1]);
};

exports.insertPureBlogEntry = async (req, res, next, dbClient) => {
  const newId = uuid();
  // init truncated content
  // init the pure blog
  const result = await Promise.all([
    initTruncatedPureBlog(req, newId, dbClient),
    Storage.insert(
      { ...req.body, item: { ...req.body.item, previewId: newId } },
      dbClient
    ),
  ]);
  res.status(200).json(result[1]);
};
