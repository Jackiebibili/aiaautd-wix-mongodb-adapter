const NotFoundError = require('../../model/error/not-found');
const BadCredentials = require('../../model/error/bad-credentials');
const Storage = require('../../service/storage');
const client = require('../../client/mongodb');
const jwt = require('../jwt-auth');
const authUtil = require('../auth-util');
const DB_CONFIG = require('../../constants/config');

const randomSecretByteLength = 64;
const serverNonceByteLength = 128;
const passwordSaltColumn = 'passwordSalt';

const deleteAllOldToken = (username, dbClient) =>
  client.deleteMany(
    DB_CONFIG.DATABASE_NAME.USER,
    DB_CONFIG.COLLECTION_NAME.USER.TOKEN,
    { username },
    dbClient,
    true
  );

const issueToken = (accountId, username, dbClient) => {
  return deleteAllOldToken(username, dbClient)
    .then(() => {
      // Initiziate a Token and store in database
      const date = jwt.getExpireDate();
      const randBytes = authUtil.getRandomBytesWithLength(
        randomSecretByteLength
      );
      const token = jwt.generateAccessToken(accountId, randBytes);
      const base64Token = Buffer.from(token).toString('base64');

      return Storage.insert(
        {
          site_db_name: DB_CONFIG.DATABASE_NAME.USER,
          collectionName: DB_CONFIG.COLLECTION_NAME.USER.TOKEN,
          item: {
            secret: randBytes,
            token: base64Token,
            username,
            expiryDate: date,
          },
        },
        dbClient
      );
    })
    .then((data) => {
      return { token: data.item.token };
    })
    .catch((err) => {
      throw new Error(err.message);
    });
};

const isUserAccountExist = (username, dbClient) => {
  return client
    .query(
      DB_CONFIG.DATABASE_NAME.USER,
      DB_CONFIG.COLLECTION_NAME.USER.USER_ACCOUNT,
      {
        skip: 0,
        limit: 1,
        filter: { query: { username } },
        sort: {},
      },
      dbClient
    )
    .then((res) => {
      if (res.length === 0) {
        // user account not found
        throw new NotFoundError();
      }
      return res[0];
    });
};

const deleteAllOldServerNonce = (username, dbClient) => {
  return client.deleteMany(
    DB_CONFIG.DATABASE_NAME.USER,
    DB_CONFIG.COLLECTION_NAME.USER.NONCE,
    { username },
    dbClient,
    true
  );
};

const getServerNonceAndSalt = (username, dbClient) => {
  return isUserAccountExist(username, dbClient)
    .then((res) => {
      // delete all server nonce
      return Promise.all([
        Promise.resolve(res[passwordSaltColumn]),
        // deleteAllOldServerNonce(username, dbClient),
      ]);
    })
    .then((res) => {
      const salt = res[0];
      // generate the nonce
      const nonceHexStr = authUtil.getRandomBytesWithLength(
        serverNonceByteLength
      );

      // save the temporary server nonce with username
      return Storage.insert(
        {
          site_db_name: DB_CONFIG.DATABASE_NAME.USER,
          collectionName: DB_CONFIG.COLLECTION_NAME.USER.NONCE,
          item: { username, nonce: nonceHexStr },
        },
        dbClient
      ).then(() => {
        return { salt, nonce: nonceHexStr };
      });
    })
    .catch((err) => {
      if (err instanceof NotFoundError) {
        throw new BadCredentials();
      }
      throw err;
    });
};

const authenticate = (req, dbClient) => {
  const username = req.body.username;
  const nonceHash = req.body.nonceHash;
  const clientNonce = req.body.clientNonce;

  if ([username, nonceHash, clientNonce].some((item) => !item)) {
    throw new BadCredentials();
  }

  return isUserAccountExist(username, dbClient).then((res) => {
    // get the server nonce
    return Promise.all([
      Promise.resolve({
        accountId: res._id,
        password: res.password,
      }),
      client.query(
        DB_CONFIG.DATABASE_NAME.USER,
        DB_CONFIG.COLLECTION_NAME.USER.NONCE,
        {
          skip: 0,
          limit: 1,
          filter: { query: { username } },
          sort: { sort: { lastModifiedDate: -1 } }, // get the most recent nonce
        },
        dbClient
      ),
    ]).then((res) => {
      const [account, nonceRes] = res;
      if (nonceRes.length === 0) {
        throw new BadCredentials();
      }
      const pwHash = account.password;
      const serverNonce = nonceRes[0].nonce;
      // generate the nonce hash
      const serverNonceHash = authUtil.getNonceHash(
        serverNonce,
        pwHash,
        clientNonce
      );
      // compare
      if (serverNonceHash !== nonceHash) {
        throw new BadCredentials();
      }
      // delete all old nonce
      deleteAllOldServerNonce(username, dbClient);
      return { accountId: account.accountId, username };
    });
  });
};

module.exports = {
  issueToken,
  authenticate,
  getServerNonceAndSalt,
  deleteAllOldToken,
  passwordSaltColumn,
};
