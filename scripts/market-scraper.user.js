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
const getLatestPrices = "/api/latestPrice";


//post market data
const postMarketData = function(data) {
    console.log("posting market data!")
    console.log(data)
    fetch(herokuServer + postOrderHistory, {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    }).then(res => {
        console.log("Request complete! response:", res);
    });
}

const showInvValue = function(values) {
    let currency = Array.from(document.getElementsByTagName('div')).filter(e => e.innerText === 'Currencies')[0]
    console.log(currency)
    let newEle = document.createElement('div')
    let text = document.createTextNode("Vendor: " + values[0] + "\nSell: " + values[1] + "\nMarket middle: " + values[2])
    newEle.textContent = text;
    newEle.style.height = 100;
    newEle.style.width = 300;

    currency = currency.parentNode;
    currency.prepend(newEle)
    console.log(newEle)
}

//get total inventory value
const calcInvValue = function(items, prices) {
    let priceMap = {}
    prices.forEach(p => {priceMap[p.itemHrid]=p})
    console.log(items, prices)
    let vendorValue = 0
    let bidValue = 0
    let avgValue = 0

    items.forEach(i => {
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
    console.log(vendorValue, bidValue, avgValue)
    showInvValue([vendorValue, bidValue, avgValue])

}

const getInvValue = async function(items) {
    fetch(herokuServer + getLatestPrices, {
        method: "GET",
        headers: {'Content-Type': 'application/json'}
    }).then(res => {
        console.log("Got latest prices from server!")
        return res.json()
    }).then(data => calcInvValue(items, data));;
}


//get market listing value
const marketListingValue = function(data) {

}

//websocket spy
const onRecieve = function(event) {
    let jsonData = event.data;
    let parsedData = JSON.parse(jsonData)
    console.log(parsedData)
    if(parsedData.type === "market_item_order_books_updated") {
        //postMarketData(parsedData.marketItemOrderBooks)
    }
    if(parsedData.type === "init_character_info") {
        let items = parsedData.characterItems;
        items = items.map(x => {
            x.itemHrid = x.itemHrid.substring(1)
            x.itemHrid = x.itemHrid.replace("/","-")
            return x
        })
        getInvValue(items)
    }
    if(parsedData.type === "") {

    }

}
const onSend = function(data) {
    console.log("sending:");
    console.log(data);
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






