const register = require('./register');

const registerUser = async (req, res, next, dbClient) => {
  const userAccountInfo = await register.registerOneNewUser(req, dbClient);

  res.status(200).json(userAccountInfo);
};

module.exports = {
  registerUser,
};
