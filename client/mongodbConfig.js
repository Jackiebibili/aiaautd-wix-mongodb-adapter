module.exports = {
  URI: `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PW}@cluster0.2hycd.mongodb.net/${process.env.MONGODB_DEFAULT_DB}?retryWrites=true&w=majority`,
};
