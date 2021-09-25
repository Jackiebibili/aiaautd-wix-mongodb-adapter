const Storage = require('../service/storage');
const CONFIG = require('../constants/config');

const fullEventForeignKeys = [
  {
    name: 'files',
    type: 'ARRAY',
    property: ['fileId'],
    collectionName: CONFIG.COLLECTION_NAME.MAIN.FILE,
  },
  {
    name: 'leads',
    type: 'ARRAY',
    property: ['leadId'],
    collectionName: CONFIG.COLLECTION_NAME.MAIN.OFFICER,
  },
  {
    name: 'pureBlogId',
    type: 'STRING',
    property: [],
    collectionName: CONFIG.COLLECTION_NAME.MAIN.PURE_BLOG,
  },
];

const truncatedEventForeignKeys = [
  {
    name: 'files',
    type: 'ARRAY',
    property: ['fileId'],
    collectionName: CONFIG.COLLECTION_NAME.MAIN.FILE,
  },
  {
    name: 'leads',
    type: 'ARRAY',
    property: ['leadId'],
    collectionName: CONFIG.COLLECTION_NAME.MAIN.OFFICER,
  },
  {
    name: 'pureBlogPreviewId',
    type: 'STRING',
    property: [],
    collectionName: CONFIG.COLLECTION_NAME.MAIN.TRUNCATED_PURE_BLOG,
  },
];

const getValueFromObjNestedProperty = (obj, propertyList = []) => {
  if (propertyList.length === 0) {
    return obj;
  }
  if (obj === undefined) {
    throw new Error('cannot get property of undefined');
  }
  return getValueFromObjNestedProperty(
    obj[propertyList[0]],
    propertyList.slice(1)
  );
};

const getDocumentsFromForeignKeys = (obj, objFormatEntry, dbClient) => {
  const item = obj[objFormatEntry.name];
  if (objFormatEntry.type === 'ARRAY') {
    return Promise.all(
      item.map((entry) =>
        Storage.get(
          {
            collectionName: objFormatEntry.collectionName,
            itemId: getValueFromObjNestedProperty(
              entry,
              objFormatEntry.property
            ),
          },
          dbClient
        ).then((data) => data.item)
      )
    );
  }
  // single flatten value
  return Storage.get(
    {
      collectionName: objFormatEntry.collectionName,
      itemId: item,
    },
    dbClient
  ).then((data) => data.item);
};

const formatEventData = (formatKeys, dbClient) => (eventList) => {
  return Promise.all(
    eventList.items.map((item) => {
      return Promise.all(
        formatKeys.map((insertedDocFormat) =>
          getDocumentsFromForeignKeys(item, insertedDocFormat, dbClient)
        )
      ).then((insertedList) => {
        const insertedObj = insertedList.reduce((obj, value, idx) => {
          return { ...obj, [formatKeys[idx].name]: value };
        }, {});
        return { ...item, ...insertedObj };
      });
    })
  );
};

exports.getBlogEntry = async (req, res, next, dbClient) => {
  Storage.get(
    { ...req, body: { collectionName: CONFIG.COLLECTION_NAME.MAIN.EVENT } },
    dbClient
  )
    .then((event) =>
      formatEventData(fullEventForeignKeys, dbClient)({ items: [event.item] })
    )
    .then((data) => res.status(200).json(data));
};

exports.findBlogEntry = (req, res, next, dbClient) => {
  Storage.find(
    { ...req, body: { collectionName: CONFIG.COLLECTION_NAME.MAIN.EVENT } },
    dbClient
  )
    .then(formatEventData(truncatedEventForeignKeys, dbClient))
    .then((data) => res.status(200).json(data));
};

exports.findFullBlogEntry = async (req, res, next, dbClient) => {
  Storage.find(
    { ...req, body: { collectionName: CONFIG.COLLECTION_NAME.MAIN.EVENT } },
    dbClient
  )
    .then(formatEventData(fullEventForeignKeys, dbClient))
    .then((data) => res.status(200).json(data));
};

exports.updateBlogEntry = async (req, res, next, dbClient) => {
  const resUpdate = await Storage.update(req.body, dbClient);
  res.status(200).json(resUpdate.item);
};
