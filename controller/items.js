const Storage = require('../service/storage')

exports.findItems = async (req, res) => {
   const findResult = await Storage.find(req.body)

   res.status(200).json(findResult)
}

exports.getItem = async (req, res) => {
   const getResult = await Storage.get(req.body)

   res.status(200).json(getResult)
}

exports.insertItem = async (req, res) => {
   // console.log('called insert with body: ' + JSON.stringify(req.body));
   const insertResult = await Storage.insert(req.body)
   res.status(200).json(insertResult)
}

exports.updateItem = async (req, res) => {
   const updateResult = await Storage.update(req.body)

   res.status(200).json(updateResult)
}

exports.removeItem = async (req, res) => {
   const removeResult = await Storage.remove(req.body)

   res.status(200).json(removeResult)
}

exports.countItems = async (req, res) => {
   // console.log('called count with body: ' + JSON.stringify(req.body));
   const countResult = await Storage.count(req.body)

   res.status(200).json(countResult)
}