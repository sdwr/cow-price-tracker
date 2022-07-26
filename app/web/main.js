import {api} from './api.js';
import {marketview} from './marketview.js';



const app = new Vue({
    el: '#app',
    data: {
        message: "Milky Way Price Tracker",
        items: [],
        currentItem: {itemHrid: ""},
        itemSearch: "",
        filteredItems: [],
        priceGraph: null,
        depthGraph: null

    
    },
    created: function() {
        this.loadItems();
    },
    mounted: function() {
        this.priceGraph = document.getElementById("price-graph");
        this.depthGraph = document.getElementById("depth-graph");
    },
    methods: {
        loadItems: function() {
            api.getAllItems()
                .then(response => response.json())
                .then(json => {
                    this.items = JSON.parse(JSON.stringify(json));
                    this.filterItems()
                    if(this.filteredItems && this.filteredItems.length > 0) {
                        this.selectItem(this.filteredItems[0])
                    }
                })
        },

        selectItem: function(item) {
            console.log("selected " + item.itemHrid)
            api.getOrderHistory(item.itemHrid)
                .then(response => response.json())
                .then(json => {
                    this.currentItem = JSON.parse(JSON.stringify(json));
                    marketview.drawItem(this, this.currentItem);
                })
        },

        clearItems: function() {
            this.itemSearch = "";
            this.filterItems();
        },

        filterItems: function() {
            if(this.itemSearch != "") {
                this.filteredItems = this.items.filter(x => {
                    let i = x.itemHrid.split("-");
                    let itemName = i[1]
                    itemName = itemName.replaceAll("_", " ");
        
                    return itemName.includes(this.itemSearch)
                });
            } else {
                this.filteredItems = this.items;
            }
            this.filteredItems = this.filteredItems.slice(0, 20);
        },

        postOrderBooks: function() {
            let orderBooks = parseOrderBooks(this.post.orderBooks);
        
            if(validateOrderBooks(orderBooks)){
                api.appendToOrderHistory(orderBooks)
            }
        },

        isSelected: function(item) {
            return this.currentItem.itemHrid === item.itemHrid;
        }
    },



});

//helpers

function parseOrderBooks(orderBooks) {
    orderBooks = JSON.parse(orderBooks);
    if(orderBooks.marketItemOrderBooks) {
        orderBooks = orderBooks.marketItemOrderBooks;
    }
    return orderBooks;
}

function validateOrderBooks(orderBooks) {
    if(orderBooks.itemHrid && orderBooks.orderBooks) {
        return true;
    }
    return false;
}

