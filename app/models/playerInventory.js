const mongoose = require('mongoose');

//date in Date.now(), ms since 1970
//value is {value: Number, time: Number}
const PlayerInventorySchema = new mongoose.Schema({
    name: String,
    userID: Number,
    value: Number,
    valueHistory: Object,
    lastUpdated: Number
});

module.exports = mongoose.model('PlayerInventory', PlayerInventorySchema);