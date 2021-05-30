const Storage = require('../service/storage');

exports.getBlogEntry = async (req, res, next, dbClient) => {
  const getBlog = await Storage.get(req.body, dbClient);
  const { fullFiles, fullLeads } = getBlogFullPromises(req, dbClient, [
    getBlog.item,
  ]);

  const [files, leads] = await Promise.all([
    Promise.all(fullFiles),
    Promise.all(fullLeads),
  ]);
  getBlog.item = [getBlog.item].map((item, idx) => {
    return { ...item, files: files[idx], leads: leads[idx] };
  })[0];

  // return json response
  res.status(200).json(getBlog);
};

exports.findBlogEntry = async (req, res, next, dbClient) => {
  const getBlog = await Storage.find(req, dbClient);
  if (!getBlog.items) {
    // no items - return an empty array
    res.status(200).json(getBlog);
  }
  const { fullFiles, fullLeads } = getBlogFullPromises(
    req,
    dbClient,
    getBlog.items
  );
  // const files = await Promise.all(fullFiles);
  // const leads = await Promise.all(fullLeads);
  const [files, leads] = await Promise.all([
    Promise.all(fullFiles),
    Promise.all(fullLeads),
  ]);
  getBlog.items = getBlog.items.map((item, idx) => {
    return { ...item, files: files[idx], leads: leads[idx] };
  });

  // return json response
  res.status(200).json(getBlog);
};

exports.updateBlogEntry = async (req, res, next, dbClient) => {
  const resUpdate = await Storage.update(req.body, dbClient);
  res.status(200).json(resUpdate.item);
};

const getBlogFullPromises = (req, dbClient, blogs) => {
  // restore the files info by id
  const fullFiles = blogs
    .map((item) => {
      return item.files.reduce((acc, arr) => {
        if (arr.fileId) {
          return [...acc, arr.fileId];
        } else {
          return acc;
        }
      }, []);
    })
    .map((filesId) => {
      return getListOfItems(
        filesId,
        'file-label',
        req.body.requestContext.site_db_name,
        dbClient
      );
    });
  // restore the leads info by id
  const fullLeads = blogs
    .map((item) => {
      return item.leads.reduce((acc, arr) => {
        if (arr.leadId) {
          return [...acc, arr.leadId];
        } else {
          return acc;
        }
      }, []);
    })
    .map((leadsId) => {
      return getListOfItems(
        leadsId,
        'officers',
        req.body.requestContext.site_db_name,
        dbClient
      );
    });
  return { fullFiles, fullLeads };
};

const getListOfItems = async (ids, collectionName, site_db_name, dbClient) => {
  const items = ids.map((id) => {
    return Storage.get(
      {
        itemId: id,
        collectionName,
        requestContext: { site_db_name },
      },
      dbClient
    );
  });
  const results = await Promise.all(items);
  return results.map((item) => item.item);
};
