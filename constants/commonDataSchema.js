const uuid = require('uuid').v4;

module.exports = {
  commonFields: {
    _id: () => uuid(),
    createdDate: () => new Date(),
    lastModifiedDate: () => new Date(),
  },
};
