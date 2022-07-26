const router = require('express').Router();
const mongoose = require('mongoose');
const moment = require('moment');
const CONSTANTS = require('../../constants');
const OrderHistory = mongoose.model('OrderHistory');
const ErrorLogSchema = mongoose.model('ErrorLog');

require('../../constants');

function getAllItems(req, res) {
    return OrderHistory.find({}, {})
        .then(result => result.map(o => {
            return {itemHrid: o.itemHrid, itemThumbnail: o.itemThumbnail, lastUpdated: o.lastUpdated}
        }))
        .then(result => res.send(result))
        .catch(err => res.status(500).send(err));
}

function getOrderHistory(req, res) {
    let itemHrid = req.params.id;
    return OrderHistory.findOne({itemHrid: itemHrid})
        .then(result => res.send(result))
        .catch(err => res.status(500).send(err));
}

function appendToOrderHistory(req, res) {
    console.log(req.body);
    let itemHrid = cleanItemHrid(req.body.itemHrid);
    let time = Date.now()
    let orderBooks = {}
    orderBooks.asks = req.body.orderBooks[0].asks;
    orderBooks.bids = req.body.orderBooks[0].bids;
    orderBooks.time = time;
    return OrderHistory.updateOne({itemHrid: itemHrid},
         {$push: {orderBooks: orderBooks},
         $set: {lastUpdated: time, itemThumbnail: getThumbnail(itemHrid)}},
         { upsert: true}
         )
        .then(result => res.send(result))
        .catch(err => res.status(500).send(err));

}

//format for order update is
//{"type":"market_item_order_books_updated","marketItemOrderBooks":{"itemHrid":"/items/donut","orderBooks":[{"asks":[{"listingId":192902,"quantity":252,"price":36},{"listingId":192828,"quantity":2344,"price":37},{"listingId":191681,"quantity":109,"price":44},{"listingId":191261,"quantity":9060,"price":47},{"listingId":179376,"quantity":30,"price":190},{"listingId":177749,"quantity":9,"price":245},{"listingId":175887,"quantity":235,"price":250},{"listingId":149309,"quantity":950,"price":500},{"listingId":26516,"quantity":8,"price":5000},{"listingId":33417,"quantity":1,"price":1000000000000}],"bids":[{"listingId":185915,"quantity":3630,"price":8},{"listingId":179404,"quantity":500,"price":7},{"listingId":83884,"quantity":2996,"price":6}]}]}}
//
// unwrapped on client, and hrid changed to format "items-name_of_item"


function cleanItemHrid(itemHrid) {
    itemHrid = itemHrid.substring(1);
    itemHrid = itemHrid.replace(/\//g, '-');
    return itemHrid;
}

//get thumbnails from itemhrid
//hrid is format <folder>-name_of_item
function getThumbnail(itemHrid) {
    let path = "";
    let item = itemHrid.split("-");
    let type = item[0];
    let name = item[1];
    if(type == 'items') {
        path += CONSTANTS.itemPath;
    } else if(type == 'abilities') {
        path += CONSTANTS.abilityPath
    }
    path = path.replace("@", name);

    return path;
}

//endpoints
router.get('/items', getAllItems);
router.get('/orderHistory/:id', getOrderHistory);
router.post('/orderHistory', appendToOrderHistory);

module.exports = router;