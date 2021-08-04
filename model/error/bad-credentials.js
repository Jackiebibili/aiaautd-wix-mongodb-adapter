module.exports = class BadCredentials extends Error {
  constructor() {
    super('Bad credentials');
  }
};
