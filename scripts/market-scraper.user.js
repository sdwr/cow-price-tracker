// ==UserScript==
// @name         milky way idle websocket wrapper
// @match      https://milkywayidle.com/game
// @match      https://www.milkywayidle.com/game
// @match      https://www.test.milkywayidle.com/game
// @match      https://test.milkywayidle.com/game
// @run-at       document-start
// @grant        none
// ==/UserScript==


const postMarketData = function(data) {
    console.log("posting market data!")
    console.log(data)
    fetch("https://cow-price-tracker-server.herokuapp.com/api/orderHistory/", {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    }).then(res => {
        console.log("Request complete! response:", res);
    });
}



const onRecieve = function(event) {
    let jsonData = event.data;
    let parsedData = JSON.parse(jsonData)
    if(parsedData.type === "market_item_order_books_updated") {
        postMarketData(parsedData.marketItemOrderBooks)
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
