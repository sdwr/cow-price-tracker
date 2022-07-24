const router = require('express').Router();
const mongoose = require('mongoose');
const moment = require('moment');
const OrderHistory = mongoose.model('OrderHistory');


function getAllItems(req, res) {
    return OrderHistory.find({}, {itemHrid})
        .then(result => result.map(o => {o.itemHrid, o.lastUpdated}))
        .then(result => res.send(result))
        .catch(err => res.status(500).send(err));
}

function getOrderHistory(req, res) {
    let itemHrid = req.params.itemHrid;
    return OrderHistory.find({itemHrid})
        .then(result => res.send(result))
        .catch(err => res.status(500).send(err));
}

function appendToOrderHistory(req, res) {
    let parsedOrderBook = parseOrderBook(req.body.orderBook);
    let itemHrid = parsedOrderBook.itemHrid;
    let orderBook = parsedOrderBook.orderBooks
    let time = parsedOrderBook.time;
    return OrderHistory.updateOne({itemHrid, lastUpdated: { $lt: time - (1000 * 60 * 5)}},
        {$push: {orderBooks: orderBook},
         $set: {lastUpdated: parsedOrderBook.time}})
        .then(result => res.send(result))
        .catch(err => res.status(500).send(err));

}

//format is
//{"type":"market_item_order_books_updated","marketItemOrderBooks":{"itemHrid":"/items/donut","orderBooks":[{"asks":[{"listingId":192902,"quantity":252,"price":36},{"listingId":192828,"quantity":2344,"price":37},{"listingId":191681,"quantity":109,"price":44},{"listingId":191261,"quantity":9060,"price":47},{"listingId":179376,"quantity":30,"price":190},{"listingId":177749,"quantity":9,"price":245},{"listingId":175887,"quantity":235,"price":250},{"listingId":149309,"quantity":950,"price":500},{"listingId":26516,"quantity":8,"price":5000},{"listingId":33417,"quantity":1,"price":1000000000000}],"bids":[{"listingId":185915,"quantity":3630,"price":8},{"listingId":179404,"quantity":500,"price":7},{"listingId":83884,"quantity":2996,"price":6}]}]}}
//
// unwrapped on client, and hrid changed to format "items-name_of_item"
function parseOrderBook(data) {
    let orderBook = data.marketItemOrderBooks;
    orderBooks.time = Date.now()
    //validate orderBooks here
    
    return orderBook;
}

//endpoints
router.get('/items', getAllItems);
router.get('/orderHistory/:id', getOrderHistory);
router.post('/orderHistory/:id', appendToOrderHistory);

module.exports = router;