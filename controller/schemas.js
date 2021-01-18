const Schema = require('../service/schema')

exports.findSchemas = async (req, res, next, dbClient) => {
   const findResult = await Schema.find(req.body, dbClient)

   res.status(200).json(findResult)
}

exports.listSchemas = async (req, res, next, dbClient) => {
   const findResult = await Schema.list(req.body, dbClient)

   res.status(200).json(findResult)
}
