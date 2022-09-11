const router = require('express').Router();
const mongoose = require('mongoose');
const crypto = require('crypto');

const CONSTANTS = require('../../constants');
const PlayerInventory = mongoose.model('PlayerInventory');
const OrderHistory = mongoose.model('OrderHistory');
const OrderBook = mongoose.model('OrderBook');
const Sale = mongoose.model('Sale');
//const vendorPrices = require('../../vendorPrices');

let LINK_EXPIRATION = 1000 * 3600;


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

async function transferOrdersToSeparateSchema(req, res) {
    let allItems = await OrderHistory.find({}, {itemHrid: 1, vendor: 1, latestAsk: 1, latestBid: 1, lastUpdated: 1})
    
    req.setTimeout(1000 * 3600 * 3)
    res.setTimeout(1000 * 3600 * 3)

    for(item of allItems) {
        let fullItem = await OrderHistory.findOne({itemHrid: item.itemHrid});
        let orderBooks = fullItem.orderBooks;

        let update = [];

        for(ob of orderBooks) {

            let stats = getStatsFromOrderBook(ob)
            let bestAsk = stats[0]
            let bestBid = stats[1]
            let totalAsks = stats[2]
            let totalBids = stats[3]

            console.log("pushing book!" + totalAsks)
            let write = {
                updateOne: {
                    "filter": {
                        "orderHistoryID": fullItem.id,
                        "itemHrid": fullItem.itemHrid,
                        "time": ob.time    
                        },
                    "update": { $set: {
                        "orderHistoryID": fullItem.id,
                        "itemHrid": fullItem.itemHrid,
                        "bestAsk": bestAsk,
                        "bestBid": bestBid,
                        "totalAsks": totalAsks,
                        "totalBids": totalBids,
                        "asks": ob.asks,
                        "bids": ob.bids,
                        "time": ob.time
                    }},
                    "upsert": true
                }
            }
            update.push(write)

            if(update.length > 20) {
                console.log("saving batch!")
                await OrderBook.bulkWrite(update)
                        .then(result => console.log(result))
                        .catch(err => console.log(err));
                update = []
            }
        }
        console.log("item done: " + item.itemHrid)
    }

    console.log("done!")
}

function getProfileLink(req, res) {
    let userID = req.params.id;
    let time = Date.now();
    let link = crypto.randomBytes(5).toString('hex');
    let profileLink = {link: link, expiryTime: time + LINK_EXPIRATION}

    return PlayerInventory.updateOne({userID: userID},
        { 
            $set: {profileLink: profileLink}
        })
        .then(result => res.send({result: result, link: link}))
        .catch(err => res.status(500).send(err))
}

function getProfileByLink(req, res) {
    let link = req.params.link;
    let time = Date.now();
    
    return PlayerInventory.findOne(
        {
            "profileLink.link": link,
            "profileLink.expiryTime": {$gt: time}
        })
        .then(result => res.send(result))
        .catch(err => res.status(500).send(err));

}

function getSaleHistory(req, res) {
    let userID = req.params.id;
    return Sale.find({userID: userID}).sort({lastUpdated: 1})
        .then(result => res.send(result))
        .catch(err => res.status(500).send(err));

}

function getLatest(req, res) {
    return OrderHistory.find({}, {itemHrid: 1, vendor: 1, latestAsk: 1, latestBid: 1, lastUpdated: 1})
        .then(result => res.send(result))
        .catch(err => res.status(500).send(err));
}

function getAllItems(req, res) {
    return OrderHistory.find({}, {itemHrid: 1, itemThumbnail: 1, lastUpdated: 1})
        .then(result => res.send(result))
        .catch(err => res.status(500).send(err));
}

function getFullOrderHistory(req, res) {
    let itemHrid = req.params.id;
    return OrderHistory.findOne({itemHrid: itemHrid})
        .then(result => res.send(result))
        .catch(err => res.status(500).send(err));
}

function getSmallOrderHistory(req, res) {
    let itemHrid = req.params.id;
    return joinOrderHistory(itemHrid, res)
        .then(result => res.send(result))
        .catch(err => res.status(500).send(err));

}

async function joinOrderHistory(itemHrid, res) {
    let item = await OrderHistory.findOne({itemHrid: itemHrid}, {itemHrid: 1, vendor: 1, latestAsk: 1, latestBid: 1, lastUpdated: 1})
        .catch(err => res.status(500).send(err));

    let orderBooks = await OrderBook.find({orderHistoryID: item.id}, {bestAsk: 1, bestBid: 1, totalAsks: 1, totalBids: 1, time: 1})
        .catch(err => res.status(500).send(err));

    item.orderBooks = orderBooks;
    return item
}



function appendToOrderHistory(req, res) {

    if(req.body && req.body.type === "market_item_order_books_updated") {
        req.body = req.body.marketItemOrderBooks
    }
    
    console.log("Adding item: " + req.body.itemHrid);


    let itemHrid = cleanItemHrid(req.body.itemHrid);
    let time = Date.now()
    let orderBooks = {}
    orderBooks.asks = req.body.orderBooks[0].asks;
    orderBooks.bids = req.body.orderBooks[0].bids;
    orderBooks.time = time;

    return saveOrderHistoryAndOrderBook(itemHrid, orderBooks, res)
}

async function saveOrderHistoryAndOrderBook(itemHrid, orderBooks, res) {

    let stats = getStatsFromOrderBook(orderBooks)
    let bestAsk = stats[0]
    let bestBid = stats[1]
    let totalAsks = stats[2]
    let totalBids = stats[3]

    let item = await OrderHistory.findOneAndUpdate({itemHrid: itemHrid},
        {
            $push: {orderBooks: orderBooks},
            $set: 
            {
                latestAsk: bestAsk,
                latestBid: bestBid,
                lastUpdated: orderBooks.time, 
                itemThumbnail: getThumbnail(itemHrid)
            }
        },
        {   upsert: true,
            new: true,
            projection: {id: 1, itemHrid: 1, latestAsk: 1, latestBid: 1, lastUpdated: 1}
        }
    ).catch(err => res.status(500).send(err))

    return OrderBook.updateOne(
        {itemHrid: itemHrid, time: orderBooks.time}, 
        {
            $set: {
                "orderHistoryID": item.id,
                "itemHrid": item.itemHrid,
                "bestAsk": bestAsk,
                "bestBid": bestBid,
                "totalAsks": totalAsks,
                "totalBids": totalBids,
                "asks": orderBooks.asks,
                "bids": orderBooks.bids,
                "time": orderBooks.time
            }
        },
        {upsert: true}
    ).then(result => res.send(result))
    .catch(err => res.status(500).send(err));

}

//data format {userID: String, name: String, invValue: Number}
function postInventory(req, res) {
    let data = req.body;
    let userID = data.userID;
    let name = data.name;
    let value = data.invValue;
    let time = Date.now();

    return PlayerInventory.updateOne({userID: userID},
        {
            $push: {valueHistory: {value: value, time: time}},
            $set:
            {
                userID: userID,
                name: name,
                value: value,
                lastUpdated: time
            }
        },
        { upsert: true}

    ) 
    .then(result => res.send(result))
    .catch(err => res.status(500).send(err));
}

function getMarketHistory(req, res) {
    let userID = req.params.userID;

    return Sale.find({userID: userID}, {})
        .then(result => res.send(result))
        .catch(err => res.status(500).send(err));
}

//data format {userID: String, name: String, sale: Sale}
function postMarketSale(req, res) {
    //placeholder
    let sale = req.body;
    let userID = sale.userID;
    let saleID = sale.id;
    sale.itemHrid = cleanItemHrid(sale.itemHrid);
    let time = Date.now();

    sale.time = time;
    sale.itemHrid = cleanItemHrid(sale.itemHrid);
    
    return Sale.updateOne({saleID: saleID},
            {
                $set: {
                    saleID: saleID,
                    userID: userID,
                    enhancementLevel: sale.enhancementLevel,
                    filledQuantity: sale.filledQuantity,
                    orderQuantity: sale.orderQuantity,
                    price: sale.price,
                    taxTaken: sale.taxTaken,
                    itemHrid: sale.itemHrid,
                    isSell: sale.isSell,
                    lastUpdated: time
                },
                $push: {filledHistory: {time: time, filledQuantity: sale.filledQuantity}}
            },
            {upsert: true}
        )
        .then(result => res.send(result))
        .catch(err => res.status(500).send(err));
}

//format for order update is
//{"type":"market_item_order_books_updated","marketItemOrderBooks":{"itemHrid":"/items/donut","orderBooks":[{"asks":[{"listingId":192902,"quantity":252,"price":36},{"listingId":192828,"quantity":2344,"price":37},{"listingId":191681,"quantity":109,"price":44},{"listingId":191261,"quantity":9060,"price":47},{"listingId":179376,"quantity":30,"price":190},{"listingId":177749,"quantity":9,"price":245},{"listingId":175887,"quantity":235,"price":250},{"listingId":149309,"quantity":950,"price":500},{"listingId":26516,"quantity":8,"price":5000},{"listingId":33417,"quantity":1,"price":1000000000000}],"bids":[{"listingId":185915,"quantity":3630,"price":8},{"listingId":179404,"quantity":500,"price":7},{"listingId":83884,"quantity":2996,"price":6}]}]}}
//
// unwrapped on client, and hrid changed to format "items-name_of_item"


function cleanItemHrid(itemHrid) {
    if(itemHrid.charAt(0) == '/') {
        itemHrid = itemHrid.substring(1);
    }
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

function getStatsFromOrderBook(ob) {
    bestAsk = 0
    bestBid = 0
    totalAsks = 0
    totalBids = 0

    if(ob.asks && ob.asks.length > 0) {
        bestAsk = ob.asks[0].price
        totalAsks = ob.asks.reduce((prev, curr) => prev + curr.quantity, 0)
    }
    if(ob.bids && ob.bids.length > 0) {
        bestBid = ob.bids[0].price
        totalBids = ob.bids.reduce((prev, curr) => prev + curr.quantity, 0)
    }

    return [bestAsk, bestBid, totalAsks, totalBids]
}

//endpoints
//router.get('/setVendorPrices', setVendorPrices);
router.get('/transferOrderBooks', transferOrdersToSeparateSchema);
router.get('/profileLink/:id', getProfileLink);
router.get('/profileByLink/:link', getProfileByLink);
router.get('/saleHistory/:id', getSaleHistory);

router.get('/items', getAllItems);
router.get('/orderHistory/:id', getSmallOrderHistory);
router.get('/orderHistory/full/:id', getFullOrderHistory);
router.post('/orderHistory', appendToOrderHistory);

router.get('/latestPrice', getLatest);

router.get('/marketHistory', getMarketHistory);
router.post('/inventory', postInventory);
router.post('/marketSale', postMarketSale);

module.exports = router;