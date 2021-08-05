const { userLogout } = require('./logout');
const tokenHeaderName = process.env.TOKEN_HEADER_NAME;
const BadRequestError = require('../../model/error/bad-request');

const logoutUser = async (req, res, next, dbClient) => {
  const token = req.headers[tokenHeaderName];
  if (!token) {
    throw new BadRequestError();
  }

  await userLogout(token, dbClient);
  res.status(200).json({ success: true });
};

module.exports = {
  logoutUser,
};
