const Storage = require('../service/storage');

exports.findItems = async (req, res, next, dbClient) => {
  const findResult = await Storage.find(req, dbClient);

  res.status(200).json(findResult);
};

exports.getItem = async (req, res, next, dbClient) => {
  const getResult = await Storage.get(req.body, dbClient);

  res.status(200).json(getResult);
};

exports.insertItem = async (req, res, next, dbClient) => {
  const insertResult = await Storage.insert(req.body, dbClient);

  res.status(200).json(insertResult);
};

exports.updateItem = async (req, res, next, dbClient) => {
  const updateResult = await Storage.update(req.body, dbClient);

  res.status(200).json(updateResult);
};

exports.removeItem = async (req, res, next, dbClient) => {
  const removeResult = await Storage.remove(req.body, dbClient);

  res.status(200).json(removeResult);
};

exports.countItems = async (req, res, next, dbClient) => {
  const countResult = await Storage.count(req, dbClient);

  res.status(200).json(countResult);
};
