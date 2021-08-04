const BadRequestError = require('../model/error/bad-request');
const auth = require('./auth-middleware');

const getRandomNonceAndSalt = async (req, res, next, dbClient) => {
  const username = req.body.username;
  if (!username) {
    throw new BadRequestError();
  }
  const result = await auth.getServerNonceAndSalt(username, dbClient);
  res.status(200).json(result);
};

const authenticateUser = async (req, res, next, dbClient) => {
  const accountId = await auth.authenticate(req, dbClient);

  const token = await auth.issueToken(accountId, dbClient);
  res.status(200).json({ token });
};

module.exports = {
  getRandomNonceAndSalt,
  authenticateUser,
};
