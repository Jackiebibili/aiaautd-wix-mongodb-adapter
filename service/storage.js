// const uuid = require('uuid').v4;
const client = require('../client/mongodb');
const BadRequestError = require('../model/error/bad-request');
const { getFilters } = require('../client/query_support/filter-parser');
const { getSort } = require('../client/query_support/sort-parser');
const QueryParamsAggregateUndirectedGraph = require('../client/query_support/query-params-relation');
const { commonFields } = require('../constants/commonDataSchema');
const DB_CONFIG = require('../constants/config');
const mutuallyExclusiveTestObject = new QueryParamsAggregateUndirectedGraph();

exports.find = async (req, dbClient) => {
  const payload = req.body;
  const collectionName = payload.collectionName;
  const query = req.query;
  const site_db_name = DB_CONFIG.DATABASE_NAME.MAIN;
  const skip = query.skip;
  const limit = query.limit;

  // db identification
  if (!collectionName)
    throw new BadRequestError('Missing collectionName in request body');
  if (!site_db_name)
    throw new BadRequestError('Missing siteName in request body');

  // must-have skip and limit values
  if (typeof skip === 'undefined')
    throw new BadRequestError('Missing skip in request body');
  if (typeof limit === 'undefined')
    throw new BadRequestError('Missing limit in request body');

  // mutually exclusive test
  const newQuery = mutuallyExclusiveTestObject.pruneQueryParams(query);

  const formulatedQuery = {
    filter: getFilters(newQuery),
    sort: getSort(newQuery),
    skip,
    limit,
  };

  const [numDocs, results] = await Promise.all([
    client.count(site_db_name, collectionName, formulatedQuery, dbClient),
    client.query(site_db_name, collectionName, formulatedQuery, dbClient),
  ]);

  const enhanced = results.map((doc) => {
    return wrapDates({
      _id: doc.id,
      ...doc,
    });
  });

  return {
    items: enhanced,
    totalCount: enhanced.length,
    predicateMatches: numDocs,
    skip: parseInt(skip),
    limit: parseInt(limit),
    queryObj: newQuery,
  };
};

exports.get = async (payload, dbClient) => {
  let { site_db_name, collectionName, itemId } = payload;
  site_db_name = site_db_name || DB_CONFIG.DATABASE_NAME.MAIN;
  if (!collectionName)
    throw new BadRequestError('Missing collectionName in request body');
  if (!itemId) throw new BadRequestError('Missing itemId in request body');
  if (!site_db_name)
    throw new BadRequestError('Missing siteName in request body');

  const document = await client.get(
    site_db_name,
    collectionName,
    itemId,
    dbClient
  );

  if (!document) {
    throw new Error(`item ${itemId} in ${collectionName} not found`);
  }

  return {
    item: wrapDates({
      _id: document.id,
      ...document,
    }),
  };
};

exports.insert = async (payload, dbClient) => {
  let { site_db_name, collectionName, item } = payload;
  site_db_name = site_db_name || DB_CONFIG.DATABASE_NAME.MAIN;
  if (!collectionName)
    throw new BadRequestError('Missing collectionName in request body');
  if (!item) throw new BadRequestError('Missing item in request body');
  if (!site_db_name)
    throw new BadRequestError('Missing siteName in request body');

  // common data field default values
  Object.entries(commonFields).forEach(([field, getDefaultValue]) => {
    if (typeof item[field] === 'undefined') {
      item[field] = getDefaultValue.call();
    }
  });
  await client.insert(
    site_db_name,
    collectionName,
    extractDates(item),
    dbClient
  );

  return { item: wrapDates(item) };
};

exports.update = async (payload, dbClient) => {
  let { site_db_name, collectionName, item } = payload;
  site_db_name = site_db_name || DB_CONFIG.DATABASE_NAME.MAIN;
  if (!collectionName)
    throw new BadRequestError('Missing collectionName in request body');
  if (!item) throw new BadRequestError('Missing item in request body');
  if (!site_db_name)
    throw new BadRequestError('Missing siteName in request body');

  const res = await client.update(
    site_db_name,
    collectionName,
    extractDates(item),
    dbClient
  );

  return { item: wrapDates(res.ops) };
};

exports.remove = async (payload, dbClient) => {
  const { collectionName, itemId } = payload;
  const site_db_name = DB_CONFIG.DATABASE_NAME.MAIN;
  if (!collectionName)
    throw new BadRequestError('Missing collectionName in request body');
  if (!itemId) throw new BadRequestError('Missing itemId in request body');
  if (!site_db_name)
    throw new BadRequestError('Missing siteName in request body');

  // atomic action: findOneAndDelete
  const item = await client.delete(
    site_db_name,
    collectionName,
    itemId,
    dbClient
  );

  return { item: wrapDates(item) };
};

exports.removeMany = async (payload, dbClient) => {
  const { collectionName, query } = payload;
  const site_db_name = DB_CONFIG.DATABASE_NAME.MAIN;
  if (!collectionName)
    throw new BadRequestError('Missing collectionName in request body');
  if (!query || Object.values(query).length === 0) {
    // prevent delete all docs
    throw new BadRequestError('Query parameter is invalid');
  }
  if (!site_db_name)
    throw new BadRequestError('Missing siteName in request body');

  // atomic action: deleteMany
  const items = await client.deleteMany(
    site_db_name,
    collectionName,
    query,
    dbClient
  );

  return { items: wrapDates(items) };
};

exports.count = async (req, dbClient) => {
  const payload = req.body;
  const { collectionName } = payload;
  const query = req.query;
  const site_db_name = DB_CONFIG.DATABASE_NAME.MAIN;

  if (!collectionName)
    throw new BadRequestError('Missing collectionName in request body');
  if (!site_db_name)
    throw new BadRequestError('Missing siteName in request body');

  query.filter = getFilters(req.query);

  const results = await client.count(
    site_db_name,
    collectionName,
    query,
    dbClient
  );

  return { totalCount: results };
};

const extractDates = (item) => {
  // eslint-disable-next-line array-callback-return
  Object.keys(item).map((key) => {
    const value = item[key];
    // eslint-disable-next-line array-callback-return
    if (value === null) return;

    const reISO =
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/;
    if (typeof value === 'string') {
      const re = reISO.exec(value);
      if (re) {
        item[key] = new Date(value);
      }
    }
    // if wrapped in the object, accessed by the name `$date`
    if (typeof value === 'object' && '$date' in value) {
      item[key] = new Date(value.$date);
    }
  });

  return item;
};

const wrapDates = (item) => {
  // eslint-disable-next-line array-callback-return
  Object.keys(item).map((key) => {
    const value = item[key];
    if (value instanceof Date) {
      item[key] = { $date: item[key].toString() };
    }
  });

  return item;
};
