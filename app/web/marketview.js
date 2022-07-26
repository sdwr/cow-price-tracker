
function drawItem(self, item) {
    let data = plotOrderBooks(item);
    let plotData = data.plot;
    let depthData = data.depth;

    let plotLayout = {
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
    };

    let depthLayout = {
        barmode: "group",
        xaxis: {
            title: {
                text: "Time"
            }
        },
        yaxis: {
            title: {
                text: "Depth"
            }
        },
        
        margin: { 
            t: 0 
        } 

    }
    console.log(Plotly.validate(plotData, plotLayout));
    console.log(Plotly.validate(depthData, depthLayout));
    Plotly.newPlot(self.priceGraph, plotData, plotLayout);
    Plotly.newPlot(self.depthGraph, depthData, depthLayout)
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
    let depthAsks = {
        x: [],
        y: [],
        name: 'Asks',
        type: 'bar'
    };
    let depthBids = {
        x: [],
        y: [],
        name: 'Bids',
        type: 'bar'
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

            depthAsks.x.push(time)
            depthAsks.y.push(totalAsks)
        }
        if(book.bids.length > 0) {
            highestBid = book.bids[0].price;
            totalBids = book.bids.reduce((prev, curr) => prev + curr.quantity, 0)
            
            plotBids.x.push(time)
            plotBids.y.push(highestBid)

            depthBids.x.push(time)
            depthBids.y.push(totalBids)
        }
    }
    return {plot: [plotAsks, plotBids], depth: [depthAsks, depthBids]}
}

export const marketview = {drawItem}
