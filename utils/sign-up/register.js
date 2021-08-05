const client = require('../../client/mongodb');
const Storage = require('../../service/storage');
const { passwordSaltColumn } = require('../auth-middleware');
const authUtil = require('../auth-util');
const DB_CONFIG = require('../../constants/config');
const BadRequestError = require('../../model/error/bad-request');
const AlreadyExistsError = require('../../model/error/already-exists');

const passwordSaltByteLength = 128;
const userFieldName = {
  USERNAME: 'username',
  FULLNAME: 'fullName',
  GROUPS: 'groups',
  PASSWORD: 'password',
};

const getNewUser = (req, dbClient) => {
  const body = req.body;
  // input validation
  if (
    !Object.values(userFieldName).every((key) => {
      if (key === userFieldName.GROUPS) {
        return Array.isArray(body[key]) && body[key].length > 0;
      }
      return !!body[key];
    })
  ) {
    return Promise.reject(new BadRequestError());
  }
  const username = req.body[userFieldName.USERNAME];
  return client
    .query(
      DB_CONFIG.DATABASE_NAME.USER,
      DB_CONFIG.COLLECTION_NAME.USER.USER_ACCOUNT,
      {
        skip: 0,
        limit: 1,
        filter: {
          query: { username },
        },
        sort: {},
      },
      dbClient
    )
    .then((res) => {
      if (res.length > 0) {
        // username already exists
        throw new AlreadyExistsError();
      }
      return Object.values(userFieldName).reduce((acc, key) => {
        if (key === userFieldName.GROUPS) {
          // reformat the groups
          const groups = body[key].map((group) => ({ groupName: group }));
          return { ...acc, [key]: groups };
        }
        return {
          ...acc,
          [key]: body[key],
        };
      }, {});
    });
};

const hashPasswordWithSalt = (plainPw, salt) => {
  return authUtil.getPasswordHash(salt, plainPw);
};

const saveNewUser = (newUser, dbClient) => {
  // hash password
  const password = newUser[userFieldName.PASSWORD];
  const pwSalt = authUtil.getRandomBytesWithLength(passwordSaltByteLength);
  const pwHash = hashPasswordWithSalt(password, pwSalt);

  const user = {
    ...newUser,
    [userFieldName.PASSWORD]: pwHash,
    [passwordSaltColumn]: pwSalt,
    isAdmin: false,
  };

  // save the new user to DB
  return Storage.insert(
    {
      site_db_name: DB_CONFIG.DATABASE_NAME.USER,
      collectionName: DB_CONFIG.COLLECTION_NAME.USER.USER_ACCOUNT,
      item: user,
    },
    dbClient
  );
};
const registerOneNewUser = (req, dbClient) => {
  return getNewUser(req, dbClient)
    .then((data) => saveNewUser(data, dbClient))
    .then((user) => ({
      user: {
        [userFieldName.USERNAME]: user.item[userFieldName.USERNAME],
        [userFieldName.FULLNAME]: user.item[userFieldName.FULLNAME],
        [userFieldName.GROUPS]: user.item[userFieldName.GROUPS],
      },
    }));
};

module.exports = { registerOneNewUser };
