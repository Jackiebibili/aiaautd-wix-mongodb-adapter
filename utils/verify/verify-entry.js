const BadRequestError = require('../../model/error/bad-request');
const verify = require('./verify-token');
const authUtil = require('../auth-util');
const tokenHeaderName = process.env.TOKEN_HEADER_NAME;

/**
 * Authentication middleware
 */
const authenticateUserToken = async (req, res, next, dbClient) => {
  const token = req.cookies[tokenHeaderName];
  if (!token) {
    throw new BadRequestError();
  }
  const userId = await verify.authenticateToken(token, dbClient);
  const userInfo = await authUtil.getUserInfoById(userId, dbClient);
  req.body.isAdmin = userInfo.isAdmin;
  next();
};

module.exports = { authenticateUserToken };
