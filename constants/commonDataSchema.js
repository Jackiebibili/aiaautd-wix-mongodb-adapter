const uuid = require('uuid').v4;

exports.module = {
  commonFields: {
    _id: () => uuid(),
    createdDate: () => new Date(),
    lastModifiedDate: () => new Date(),
  },
};
