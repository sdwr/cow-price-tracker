
function drawWealthGraph(self, invHistory) {
    let data = plotWealth(invHistory.valueHistory);

    let layout = {
        title: {
            text: "Account Value"
        },
        xaxis: {
            title: {
                text: "Time"
            }
        },
        yaxis: {
            title: {
                text: "Account Value"
            }
        },
        
        margin: { 
            t: 0 
        } 
    };

    let graphErrors = Plotly.validate(data, layout);
    if(graphErrors) {
        console.log("Errors found in wealth graph: ")
        console.log(Plotly.validate(data, layout));
    }

    Plotly.newPlot(self.wealthGraph, data, layout);
}

//helpers
function plotWealth(valueHistory) {
    let plot = {
        x: [], 
        y: []
    };

    let currentTime = Date.now();
    let lowestAsk = -1;
    let totalAsks = 0;
    let highestBid = -1;
    let totalBids = 0;

    for(let i = 0; i < valueHistory.length; i++) {

        let time = new Date(valueHistory[i].time)
        let value = valueHistory[i].value

        //exclude outliers (improve!!)
        if(value < 1 * 1000 * 1000 * 1000) {
            plot.x.push(time)
            plot.y.push(value)
        }
    }

    return [plot]
}

export const profilecharts = {drawWealthGraph}
