const { deleteAllOldToken } = require('../login/auth');
const { isTokenInCollection } = require('../verify/verify-token');

const userLogout = (token, dbClient) => {
  return isTokenInCollection(token, dbClient).then((tokenItem) => {
    const username = tokenItem.username;
    return deleteAllOldToken(username, dbClient);
  });
};

module.exports = { userLogout };
