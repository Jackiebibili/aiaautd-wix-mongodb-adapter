const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FileSchema = new Schema({
  caption: {
    unique: true,
    required: true,
    type: String,
  },
  filename: {
    unique: true,
    required: true,
    type: String,
  },
  fileId: {
    unique: true,
    required: true,
    type: String,
  },
  createdAt: {
    default: Date.now(),
    type: Date,
  },
});

const File = mongoose.model('File', FileSchema);

module.exports = File;
