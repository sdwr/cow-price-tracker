
function drawItem(self, item) {
    let data = plotOrderBooks(item);
    let plotData = data.plot;
    let depthData = data.depth;

    let plotLayout = {
        title: {
            text: "Price History"
        },
        xaxis: {
            'visible': false
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

    let priceGraphErrors = Plotly.validate(plotData, plotLayout);
    let depthGraphErrors = Plotly.validate(depthData, depthLayout);
    if(priceGraphErrors) {
        console.log("Errors found in price graph: ")
        console.log(Plotly.validate(plotData, plotLayout));
    }
    if(depthGraphErrors){
        console.log("Errors found in depth graph: ")
        console.log(Plotly.validate(depthData, depthLayout));
    }

    Plotly.newPlot(self.priceGraph, plotData, plotLayout);
    Plotly.newPlot(self.depthGraph, depthData, depthLayout)
}

function clearPriceHistory(self) {
    Plotly.purge(self.priceGraph)
    Plotly.purge(self.depthGraph);
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

    for(let i = 0; i < orderBooks.length; i++) {
        let book = orderBooks[i]
        let time = new Date(orderBooks[i].time)
        if(book.asks.length > 0) {
            lowestAsk = book.asks[0].price;
            totalAsks = book.asks.reduce((prev, curr) => prev + curr.quantity, 0)

            //exclude values over 200M
            if(lowestAsk < 200 * 1000 * 1000) {
            
                plotAsks.x.push(time)
                plotAsks.y.push(lowestAsk)
            }

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

export const marketview = {drawItem, clearPriceHistory}
