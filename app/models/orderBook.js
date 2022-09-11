
const mongoose = require('mongoose');

//date in Date.now(), ms since 1970
// asks, bids are Order[]
const OrderBookSchema = new mongoose.Schema({
    orderHistoryID: String,
    itemHrid: String,
    bestAsk: Number,
    bestBid: Number,
    totalAsks: Number,
    totalBids: Number,
    asks: Object,
    bids: Object,
    time: Number
});

module.exports = mongoose.model('OrderBook', OrderBookSchema);