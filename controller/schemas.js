const Schema = require('../service/schema')

exports.findSchemas = async (req, res) => {
   const findResult = await Schema.find(req.body)

   res.status(200).json(findResult)
}

exports.listSchemas = async (req, res) => {
   const findResult = await Schema.list(req.body)

   res.status(200).json(findResult)
}
