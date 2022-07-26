const router = require('express').Router();
const mongoose = require('mongoose');
const moment = require('moment');

const CONSTANTS = require('../../constants');
const OrderHistory = mongoose.model('OrderHistory');
//const vendorPrices = require('../../vendorPrices');


// function setVendorPrices(req, res) {
//     let keys = Object.keys(vendorPrices);
//     let prices = [];
//     let time = Date.now();

//     keys.forEach(key => {
//         let newPrice = {}
//         newPrice.itemHrid = stringToItemHrid(key);
//         newPrice.vendor = vendorPrices[key].vendor;
//         prices.push(newPrice)
//     })

//     let update = [];
//     prices.forEach(item => {
//         let write = {updateOne: {
//             "filter": {"itemHrid": item.itemHrid},
//             "update": {$set: {"vendor": item.vendor}}
//         }}
//         update.push(write);
//     });
//     console.log(update)


//     return OrderHistory.bulkWrite(update)
//         .then(result => res.send(result))
//         .catch(err => res.status(500),send(err));
// }

function getLatest(req, res) {
    return OrderHistory.find({}, {itemHrid: 1, vendor: 1, latestAsk: 1, latestBid: 1, lastUpdated: 1})
        .then(result => res.send(result))
        .catch(err => res.status(500).send(err));
}

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
    console.log("Appending to item: ");
    console.log(req.body);
    if(req.body && req.body.type === "market_item_order_books_updated") {
        req.body = req.body.marketItemOrderBooks
    }


    let itemHrid = cleanItemHrid(req.body.itemHrid);
    let time = Date.now()
    let orderBooks = {}
    orderBooks.asks = req.body.orderBooks[0].asks;
    orderBooks.bids = req.body.orderBooks[0].bids;
    orderBooks.time = time;


    //save best price
    let ask = -1;
    let bid = -1;
    if(orderBooks.asks && orderBooks.asks.length > 0) {
        ask = orderBooks.asks[0].price;
    }
    if(orderBooks.bids && orderBooks.bids.length > 0) {
        bid = orderBooks.bids[0].price;
    }

    return OrderHistory.updateOne({itemHrid: itemHrid},
        {
            $push: {orderBooks: orderBooks},
            $set: 
            {
                latestAsk: ask,
                latestBid: bid,
                lastUpdated: time, 
                itemThumbnail: getThumbnail(itemHrid)
            }
        },
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

function stringToItemHrid(s) {
    let hrid = "items-";
    s = s.toLowerCase();
    s = s.replace(/ /g, '_');
    hrid += s;
    return hrid;
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
//router.get('/setVendorPrices', setVendorPrices);
router.get('/latestPrice', getLatest);
router.get('/items', getAllItems);
router.get('/orderHistory/:id', getOrderHistory);
router.post('/orderHistory', appendToOrderHistory);

module.exports = router;