function drawSaleTable(self, saleHistory) {
    let data = []
    let dataHash = {}
    console.log(self.saleTable)
    let table = new DataTable(self.saleTable, {
        order: [[5, 'asc']],
        iDisplayLength: 100,

        columnDefs: [
            {
                render: renderDateFromMS,
                targets: 5
            }
        ]
    });

    for(let i = 0; i < saleHistory.length; i++) {
        let sale = saleHistory[i]
        for(let j = 0; j < sale.filledHistory.length; j++) {
            let fill = sale.filledHistory[j]
            let bought = fill.filledQuantity;
            let sold = fill.filledQuantity;

            if(sale.isSell) {
                bought = 0
            } else {
                sold = 0
            }

            let row = [sale.itemHrid, bought, sold, sale.price, sale.price * fill.filledQuantity, 
                sale.lastUpdated];
            data.push(row);
        }
    }
    table.rows.add(data).draw()

}

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

function renderDateFromMS(data) {
    let date = new Date(data)
    let options = {year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric'}
    return date.toLocaleString('en-US', options)
}

export const profilecharts = {drawSaleTable, drawWealthGraph}
