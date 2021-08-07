const CryptoJS = require('crypto-js');
const client = require('../client/mongodb');
const DB_CONFIG = require('../constants/config');

function getRandomBytesWithLength(byteLength = 64) {
  return CryptoJS.lib.WordArray.random(byteLength).toString();
}

function getNonceHash(serverNonce, pwHash, clientNonce) {
  const sha256 = CryptoJS.algo.SHA256.create();
  sha256.update(pwHash);
  sha256.update(serverNonce);
  sha256.update(clientNonce);
  return sha256.finalize().toString();
}

function getPasswordHash(salt, plainPw) {
  const sha256 = CryptoJS.algo.SHA256.create();
  sha256.update(plainPw);
  sha256.update(salt);
  return sha256.finalize().toString();
}

function getUserInfoById(id, dbClient) {
  return client.get(
    DB_CONFIG.DATABASE_NAME.USER,
    DB_CONFIG.COLLECTION_NAME.USER.USER_ACCOUNT,
    id,
    dbClient
  );
}

module.exports = {
  getRandomBytesWithLength,
  getNonceHash,
  getPasswordHash,
  getUserInfoById,
};
