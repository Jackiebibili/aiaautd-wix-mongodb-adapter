const jwt = require('jsonwebtoken');

const expireHours = 2;

function generateAccessToken(userId, secret) {
  // payload must be an object in order to have an expiry date
  return jwt.sign({ id: userId }, secret, { expiresIn: `${expireHours}h` });
}

function getExpireDate() {
  const date = new Date();
  date.setHours(date.getHours() + expireHours);
  return date;
}

module.exports = { generateAccessToken, getExpireDate };
