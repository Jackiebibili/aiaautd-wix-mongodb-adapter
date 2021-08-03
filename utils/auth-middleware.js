const NotFoundError = require('../model/error/not-found');
const BadCredentials = require('../model/error/bad-credentials');
const Storage = require('../service/storage');
const client = require('../client/mongodb');
const jwt = require('../utils/jwt-auth');
const authUtil = require('../utils/auth-util');

const randomSecretByteLength = 64;
const serverNonceByteLength = 128;

const siteName = 'user-credentials';
const accountCollectionName = 'userAccount';
const nonceCollectionName = 'temp_nonce';
const tokenCollectionName = 'token';
const passwordSaltColumn = 'passwordSalt';

const issueToken = (accountId, dbClient) => {
  return ((id) => {
    // Initiziate a Token and store in database
    const date = jwt.getExpireDate();
    const randBytes = authUtil.getRandomBytesWithLength(randomSecretByteLength);
    const token = jwt.generateAccessToken(id, randBytes);
    const base64Token = Buffer.from(token).toString('base64');

    return Storage.insert(
      {
        site_db_name: siteName,
        collectionName: tokenCollectionName,
        item: { secret: randBytes, token: base64Token, expiryDate: date },
      },
      dbClient
    );
  })(accountId)
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
      siteName,
      accountCollectionName,
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
  return client
    .deleteMany(siteName, nonceCollectionName, { username }, dbClient)
    .catch((err) => {
      if (!(err instanceof NotFoundError)) {
        throw err;
      }
      return true;
    });
};

const getServerNonceAndSalt = (username, dbClient) => {
  return isUserAccountExist(username, dbClient)
    .then((res) => {
      // delete all server nonce
      return Promise.all([
        Promise.resolve(res[passwordSaltColumn]),
        deleteAllOldServerNonce(username, dbClient),
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
          site_db_name: siteName,
          collectionName: nonceCollectionName,
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
        siteName,
        nonceCollectionName,
        {
          skip: 0,
          limit: 1,
          filter: { query: { username } },
          sort: {},
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
      return account.accountId;
    });
  });
};

module.exports = {
  issueToken,
  authenticate,
  getServerNonceAndSalt,
  siteName,
  accountCollectionName,
  passwordSaltColumn,
};
