const jwt = require('jsonwebtoken');
const BadCredentials = require('../model/error/bad-credentials');
const expireHours = 2;

function generateAccessToken(userId, secret) {
  // payload must be an object in order to have an expiry date
  return jwt.sign({ id: userId }, secret, { expiresIn: `${expireHours}h` });
}

function verifyToken(token, secret) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        reject(new BadCredentials());
      }
      resolve(decoded.id);
    });
  });
}

function getExpireDate() {
  const date = new Date();
  date.setHours(date.getHours() + expireHours);
  return date;
}

function isExpired(expiryDate) {
  return new Date(expiryDate).getTime() - Date.now() <= 0;
}

module.exports = { generateAccessToken, getExpireDate, verifyToken, isExpired };
