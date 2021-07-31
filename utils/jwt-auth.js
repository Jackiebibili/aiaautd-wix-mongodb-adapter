const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');

const expireHour = '2h';
const randomSecretByteLength = 64;

function generateAccessToken(userId, secret) {
  return jwt.sign(userId, secret, { expiresIn: expireHour });
}

function getRandomSecretBytes() {
  return CryptoJS.lib.WordArray.random(randomSecretByteLength).toString();
}

module.exports = { generateAccessToken, getRandomSecretBytes };
