module.exports = class AlreadyExistsError extends Error {
  constructor() {
    super('The item already exists');
  }
};
