const GfsFiles = require('../service/gfsFiles');
const NotFoundError = require('../model/error/not-found');

exports.deleteOneFile = (req, res, next, dbClient) => {
  GfsFiles.deleteOneFile(req, res, dbClient).catch((err) => {
    if (err instanceof NotFoundError) {
      return res.status(409).json({
        success: false,
        message: 'File not found',
      });
    } else {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  });
};
