const BadCredentialsError = require('../../model/error/bad-credentials');
const auth = require('./auth');
const tokenName = process.env.TOKEN_HEADER_NAME;

const getRandomNonceAndSalt = async (req, res, next, dbClient) => {
  const username = req.body.username;
  if (!username) {
    throw new BadCredentialsError();
  }
  const result = await auth.getServerNonceAndSalt(username, dbClient);
  res.status(200).json(result);
};

const authenticateUser = async (req, res, next, dbClient) => {
  const { accountId, username } = await auth.authenticate(req, dbClient);

  const { token } = await auth.issueToken(accountId, username, dbClient);
  res
    .status(200)
    .cookie(tokenName, `${token}`, { sameSite: 'none', secure: true })
    .json({ success: true });
};

module.exports = {
  getRandomNonceAndSalt,
  authenticateUser,
};
