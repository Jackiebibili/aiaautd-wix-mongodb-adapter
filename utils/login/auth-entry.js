const BadRequestError = require('../../model/error/bad-request');
const auth = require('./auth');
const tokenName = process.env.TOKEN_HEADER_NAME;

const getRandomNonceAndSalt = async (req, res, next, dbClient) => {
  const username = req.body.username;
  if (!username) {
    throw new BadRequestError();
  }
  const result = await auth.getServerNonceAndSalt(username, dbClient);
  res.status(200).json(result);
};

const authenticateUser = async (req, res, next, dbClient) => {
  const { accountId, username } = await auth.authenticate(req, dbClient);

  const { token } = await auth.issueToken(accountId, username, dbClient);
  res.status(200).cookie(tokenName, token).json({ success: true });
};

module.exports = {
  getRandomNonceAndSalt,
  authenticateUser,
};
