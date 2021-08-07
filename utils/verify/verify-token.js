const client = require('../../client/mongodb');
const jwt = require('../jwt-auth');
const DB_CONFIG = require('../../constants/config');
const BadCredentials = require('../../model/error/bad-credentials');

const isTokenInCollection = (token, dbClient) =>
  client
    .query(
      DB_CONFIG.DATABASE_NAME.USER,
      DB_CONFIG.COLLECTION_NAME.USER.TOKEN,
      {
        skip: 0,
        limit: 1,
        filter: { query: { token } },
        sort: {},
      },
      dbClient
    )
    .then((res) => {
      if (res.length === 0) {
        throw new BadCredentials();
      }
      return res[0];
    });
const authenticateToken = (token, dbClient) => {
  // find the secret associated by the token
  return isTokenInCollection(token, dbClient)
    .then((tokenItem) => {
      // check the expiry date of the token
      if (jwt.isExpired(tokenItem.expiryDate)) {
        throw new BadCredentials();
      }
      // verify with JWT
      const secret = tokenItem.secret;
      const tokenBin = Buffer.from(token, 'base64').toString('binary');
      return jwt.verifyToken(tokenBin, secret);
    })
    .then((userId) => {
      return userId;
    })
    .catch(() => {
      throw new BadCredentials();
    });
};

module.exports = { authenticateToken, isTokenInCollection };
