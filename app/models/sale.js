const mongoose = require('mongoose');


//filledHistory cumulative, if orderQuantity is 10 and sales are 2 each,
//fH will be [{fQ: 2, time}, {fQ: 4, otherTime}, ...]
//filledHistory = [{filledQuantity: Number, time}]

const SaleSchema = new mongoose.Schema({
    saleID: Number,
    userID: Number,
    itemHrid: String,
    orderQuantity: Number,
    filledQuantity: Number,
    price: Number,
    taxTaken: Number,
    enhancementLevel: Number,
    isSell: Boolean,
    filledHistory: Object,
    lastUpdated: Number
});


module.exports = mongoose.model('Sale', SaleSchema);
