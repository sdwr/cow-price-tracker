const plotlyData = [];
const priceGraph = document.getElementById('price-graph');

function setupUI() {
    Plotly.newPlot(priceGraph, plotlyData)
}

function drawItem(item) {
    let plotData = plotOrderBooks(item);
    Plotly.newPlot(priceGraph, plotData);
}

function clear() {
    Plotly.newPlot(priceGraph, [])
}

//helpers
function plotOrderBooks(item) {
    let orderBooks = item.orderBooks;
}


export const marketview = {setupUI, drawItem, clear}