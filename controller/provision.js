const Schema = require('../service/schema');

exports.provision = async (req, res, next, dbClient) => {
  const provisionResult = await Schema.provision(req.body, dbClient);

  res.status(200).json(provisionResult);
};
