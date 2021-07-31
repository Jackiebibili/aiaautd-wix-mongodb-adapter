// const BadRequestError = require('../model/error/bad-request');
// const UnauthorizedError = require('../model/error/unauthorized');
const Storage = require('../service/storage');
const client = require('../client/mongodb');
const jwt = require('../utils/jwt-auth');

const siteName = 'copy_aiaautd';
const accountCollectionName = 'accountAlpha';
const tokenCollectionName = 'token';
const userCol = 'username';

const authMiddleware = (req, dbClient) => {
  const email = req.body.username;
  const password = req.body.password;

  // use email to find the account in the database
  return client
    .query(
      siteName,
      accountCollectionName,
      { skip: 0, limit: 1, filter: { query: { [userCol]: email } } },
      dbClient
    )
    .then((result) => {
      if (result.length === 0) {
        throw new Error('Username no find');
      }
      if (result[0].password !== password) {
        throw new Error('Password is not correct');
      }
      return result[0]._id;
    })
    .then((id) => {
      // Initiziate a Token and store in database
      const randBytes = jwt.getRandomSecretBytes();
      const token = jwt.generateAccessToken(id, randBytes);
      const base64Token = Buffer.from(token).toString('base64');
      const date = jwt.getExpireDate();

      return Storage.insert({
        site_db_name: siteName,
        collectionName: tokenCollectionName,
        item: { randBytes, token: base64Token, date },
      });
    })
    .then((data) => {
      return data.item.token;
    })
    .catch((err) => {
      throw new Error(err.message);
    });
};

module.exports = { authMiddleware };
