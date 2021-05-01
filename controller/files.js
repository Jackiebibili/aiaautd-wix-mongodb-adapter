const GfsFiles = require('../service/gfsFiles');

exports.deleteOneFile = async (req, res, next, dbClient) => {
   const deleteResult = await GfsFiles.deleteOneFile(req.body, dbClient);

   res.status(200).json(deleteResult);
}