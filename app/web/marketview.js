
function drawItem(self, item) {
    let plotData = plotOrderBooks(item);
    let layout = {
        title: {
            text: "Price History"
        },
        xaxis: {
            title: {
                text: "Time"
            }
        },
        yaxis: {
            title: {
                text: "Price"
            }
        },
        
        margin: { 
            t: 0 
        } 
    }
    console.log(Plotly.validate(plotData, layout))
    Plotly.newPlot(self.priceGraph, plotData, layout);
}

function clear(self) {
    Plotly.purge(self.priceGraph)
}

//helpers
function plotOrderBooks(item) {
    let plotAsks = {
        x: [], 
        y: [], 
        name: 'Asks'
    };
    let plotBids = {
        x: [], 
        y: [],
        name: 'Bids'
    };
    let currentTime = Date.now();
    let lowestAsk = -1;
    let totalAsks = 0;
    let highestBid = -1;
    let totalBids = 0;

    let orderBooks = item.orderBooks;
    let firstTime = orderBooks[0].time;

    for(let i = 0; i < orderBooks.length; i++) {
        let book = orderBooks[i]
        let time = book.time - firstTime;
        if(book.asks.length > 0) {
            lowestAsk = book.asks[0].price;
            totalAsks = book.asks.reduce((prev, curr) => prev + curr.quantity, 0)
            
            plotAsks.x.push(time)
            plotAsks.y.push(lowestAsk)
        }
        if(book.bids.length > 0) {
            highestBid = book.bids[0].price;
            totalBids = book.bids.reduce((prev, curr) => prev + curr.quantity, 0)
            
            plotBids.x.push(time)
            plotBids.y.push(highestBid)
        }
    }
    return [plotAsks, plotBids]
}

export const marketview = {drawItem}
