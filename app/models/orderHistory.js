const mongoose = require('mongoose');

//date in Date.now(), ms since 1970
const OrderHistorySchema = new mongoose.Schema({
    itemHrid: String,
    itemThumbnail: Object,
    orderBooks: Object,
    lastUpdated: Number
});

module.exports = mongoose.model('OrderHistory', OrderHistorySchema);