const { userLogout } = require('./logout');
const tokenHeaderName = process.env.TOKEN_HEADER_NAME;
const BadCredentialsError = require('../../model/error/bad-credentials');

const logoutUser = async (req, res, next, dbClient) => {
  const token = req.cookies[tokenHeaderName];
  if (!token) {
    throw new BadCredentialsError();
  }

  await userLogout(token, dbClient);
  res.status(200).json({ success: true });
};

module.exports = {
  logoutUser,
};
