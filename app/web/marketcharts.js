const ONE_DAY_IN_MS = 1000* 3600 * 24;

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
        yaxis: 'y2',
        type: 'bar'
    };
    let depthBids = {
        x: [],
        y: [],
        name: 'Bids',
        yaxis: 'y2',
        type: 'bar'
    };

    let currentTime = Date.now();

    let orderBooks = item.orderBooks;

    let count = 0

    for(let i = 0; i < orderBooks.length; i++) {
        let book = orderBooks[i]

        //skip most values before the cutoff time
        //only draw every value for the most recent day 
        if(currentTime - book.time > ONE_DAY_IN_MS && count != 8) {
            count++   
        } else {
            count = 0
            let date = new Date(book.time)


            //exclude values over 200M
            if(book.bestAsk < 200 * 1000 * 1000) {
            
                plotAsks.x.push(date)
                plotAsks.y.push(book.bestAsk)
            }
            depthAsks.x.push(date)
            depthAsks.y.push(book.totalAsks)
    
            
            plotBids.x.push(date)
            plotBids.y.push(book.bestBid)
    
            depthBids.x.push(date)
            depthBids.y.push(book.totalBids)
        }

        
    }

    return {plot: [plotAsks, plotBids], depth: [depthAsks, depthBids]}
}

export const marketcharts = {drawItem, clearPriceHistory}
