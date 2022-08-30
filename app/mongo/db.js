const mongoose = require('mongoose');
const url = process.env.MONGO_DB || require("../config").MONGO_DB
const dbName = 'cow-price-tracker';

mongoose.connect(url, {useNewUrlParser: true});
db = mongoose.connection;
db.on('error', console.error.bind(console, 'mongo connection error:'));
db.once('open', () => console.log('mongo connected. collections:'));
db.once('open', () => console.log(Object.keys(db.collections)));

module.exports = db;