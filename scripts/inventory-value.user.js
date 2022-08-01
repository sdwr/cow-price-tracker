// ==UserScript==
// @name         milky way idle websocket wrapper
// @match      https://milkywayidle.com/game
// @match      https://www.milkywayidle.com/game
// @match      https://www.test.milkywayidle.com/game
// @match      https://test.milkywayidle.com/game
// @run-at       document-start
// @grant        none
// ==/UserScript==


const herokuServer = "https://cow-price-tracker-server.herokuapp.com";
const localServer = "http://localhost:8080";
const postOrderHistory = "/api/orderHistory";
const postMarketSale = "/api/marketSale";
const postInventory = "/api/inventory";
const getLatestPrices = "/api/latestPrice";

let character = {}
let inventory = {}
let invValue = 0
let market = {}
let prices = {}
let pricesTime = 0

//change for dev/prod
const useServer = herokuServer
const DEBUG = false


//post inventory value
const sendInventory = function() {
    let data = {userID: character.userID, name: character.name, invValue: invValue}
    console.log("posting inventory value!")
    fetch(useServer + postInventory, {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    }).then(res => {
        if(DEBUG) {
            console.log("Request complete! response:", res);
        }
    });
}


//post market data
const postMarketData = function(data) {
    console.log("posting market data!")
    fetch(useServer + postOrderHistory, {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    }).then(res => {
        if(DEBUG) {
            console.log("Request complete! response:", res);
        }
    });
}

//post completed buy/sale from market
//format: 
// { sale: characterID, createdTimestamp, expirationTimestamp, filledQuantity,
//    orderQuantity, price, itemHrid, isSell, ... }
// }
const postSale = function(data) {
    data.userID = data.characterID;
    fetch(useServer + postMarketSale, {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    }).then(res => {
        if(DEBUG) {
            console.log("Request complete! response:", res);
        }
    });
}

const rNum = function(num) {
    let abbrev = ['', 'K', 'M', 'B', 'Tr']
    let i = 0;
    while(num > 1000) {
        i++
        num = num / 1000
    }
    if(num < 10) {
        num = Math.round(num * 100)/100
    } else {
        num = Math.round(num)
    }
    return "" + num + abbrev[i]
}

const convertItemHrid = function(x) {
    if(x.itemHrid.charAt(0) === "/") {
        x.itemHrid = x.itemHrid.substring(1)
    }
    x.itemHrid = x.itemHrid.replace("/","-")
    return x
}

//values = [vendor, sellAtBid, sellAtMiddle]
//marketValues = [vendor, sellAtBid, sellAtMiddle, sellAtAsked, bidGold]
const showInvValue = function(values, marketValues) {

    let newEle = document.getElementById('InvValue')
    let newEle2 = document.getElementById('MarketValue')

    if(!(newEle && newEle2)) {
        newEle = document.createElement('div');
        newEle.setAttribute('id', 'InvValue');
        newEle.style.textAlign="left"

        newEle2 = document.createElement('div');
        newEle2.setAttribute('id', 'MarketValue');
        newEle2.style.textAlign="left"

        let currency = Array.from(document.getElementsByTagName('div')).filter(e => e.innerText === 'Currencies')[0]
        let currencyContainer = currency.parentNode.parentNode;
        let inventoryEle = currencyContainer.parentNode;

        inventoryEle.insertBefore(newEle, currencyContainer);
        inventoryEle.insertBefore(newEle2, currencyContainer);
    }

    newEle.innerText =  "--------------------------------------Inventory value---------------------\n  Vendor: " + rNum(values[0]) + "  Sell@Lowest: " + rNum(values[1]) + "  Sell@Avg: " + rNum(values[2] + "\n");
    newEle2.innerText = "--------------------------------------Market value------------------------\n  Vendor: " + rNum(marketValues[0]) +
        "  Sell@Asked: " + rNum(marketValues[3]) + "  Sell@Avg: " + rNum(marketValues[2]) + "  Offers: " + rNum(marketValues[4]);

}

//get total inventory value
const calcInvValue = function() {
    let priceMap = {}
    prices.forEach(p => {priceMap[p.itemHrid]=p})
    let vendorValue = 0
    let bidValue = 0
    let avgValue = 0

    let log = [];

    inventory.forEach(i => {
        let price = priceMap[i.itemHrid]
        vendorValue += (price.vendor * i.count)

        if(price.latestBid > 0) {
            bidValue += (price.latestBid * i.count)
        } else {
            bidValue += (price.vendor * i.count)
        }

        if(price.latestBid > 0 && price.latestAsk > 0) {
            avgValue += (((price.latestBid + price.latestAsk) / 2) * i.count)
        } else {
            avgValue += (price.vendor * i.count)
        }
    });

    let mVendorValue = 0
    let mAskedValue = 0
    let mBidValue = 0
    let mAvgValue = 0
    let mGold = 0

    market.forEach(i => {
        let quantity = i.orderQuantity - i.filledQuantity
        if(i.isSell) {
            let price = priceMap[i.itemHrid]
            mVendorValue += (price.vendor * quantity)
            if(price.latestBid > 0) {
                mBidValue += (price.latestBid * quantity)
            } else {
                mBidValue += (price.vendor * quantity)
            }

            if(price.latestBid > 0 && price.latestAsk > 0) {
                mAvgValue += (((price.latestBid + price.latestAsk) / 2) * quantity)
            } else {
                mAvgValue += (price.vendor * quantity)
            }

            mAskedValue += (i.price * quantity)


        } else {
            mGold += quantity * i.price;
        }
    });

    showInvValue([vendorValue, bidValue, avgValue], [mVendorValue, mBidValue, mAvgValue, mAskedValue, mGold]);
    invValue = avgValue + mAvgValue + mGold;
    console.log("recalculated inventory value");

}

const getInvValue = async function() {
    //get new prices if 15 min old
    if(Date.now() - pricesTime > 1000 * 60 * 15) {
        return fetch(herokuServer + getLatestPrices, {
            method: "GET",
            headers: {'Content-Type': 'application/json'}
        }).then(res => {
            console.log("Got latest prices from server!")
            return res.json()
        }).then(res => {
            pricesTime = Date.now()
            prices = res
            calcInvValue()
        });
    } else {
        calcInvValue()
    }
}


//websocket spy
const onRecieve = function(event) {
    let jsonData = event.data;
    let parsedData = JSON.parse(jsonData)
    if(DEBUG) {
        console.log(parsedData)
    }

    let updateInvValue = false
    let postInventory = false
    if(parsedData.type === "market_item_order_books_updated") {
        //postMarketData(parsedData.marketItemOrderBooks)
    }
    //load char + inventory on startup 
    if(parsedData.type === "init_character_info") {
        updateInvValue = true;
        postInventory = true;
        character = parsedData.character;
        let items = parsedData.characterItems;
        items = items.map(x => convertItemHrid(x));
        let mark = parsedData.myMarketListings;
        mark = mark.map(x => convertItemHrid(x));
        inventory = items;
        market = mark;
    } else if(parsedData.type === "market_listings_updated") {
        updateInvValue = true;

        let item = parsedData.endMarketListings[0]
        item = convertItemHrid(item);

        //post data if completed sale
        console.log("is sale?")
        console.log(item)
        if(item.status === "/market_listing_status/filled" ||
            item.status === "/market_listing_status/active") {
            if(item.unclaimedCoinCount === 0 && 
               item.unclaimedItemCount === 0 &&
               item.filledQuantity != 0
            ) {
                //at least some of the order has been filled
                console.log("made sale!")
                postSale(item)
            }
        }

        //update local est market value
        if(market) {
            let index = market.findIndex(e => e.id === item.id)
            if(index >= 0) {
                if(market[index].createdTimestamp = market[index].expirationTimestamp) {
                    //listing expired or completed
                    market.splice(index, 1)
                } else {
                    market[index] = item
                }
            } else {
                market.push(item);
            }
        }
    } else if(parsedData.endCharacterItems) {
        updateInvValue = true;
        for(let item of parsedData.endCharacterItems) {
            item = convertItemHrid(item);
            let index = inventory.findIndex(e => e.id === item.id)
            if(index >= 0) {
                inventory[index] = item
            } else {
                inventory.push(item);
            }
        }
    }

    if(updateInvValue) {
        getInvValue().then(res => {
            if(postInventory) {
                sendInventory()
            }
        })
    }

}
const onSend = function(data) {
    //console.log("sending:");
    //console.log(data);
}


window.mysocket = undefined;
const nativeSocket = window.WebSocket;
window.WebSocket = function(...args){
    console.log("made a socket!")
    const socket = new nativeSocket(...args);
    window.mysocket = socket;
    const spy = function(event) {
        onRecieve(event)
    }
    window.mysocket.addEventListener('message', spy);

    window.mysocket.oldSend = window.mysocket.send
    window.mysocket.send = function(data){
        onSend(data)
        window.mysocket.oldSend(data);
    }

    console.log("added spy to websocket!");
    return socket;
};






