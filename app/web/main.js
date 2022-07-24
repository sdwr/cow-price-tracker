import {api} from './api.js';

const app = new Vue({
    el: '#app',
    data: {
        message: "Milky Way Price Tracker",
        items: [],
        currentItem: {itemHrid: ""},
        post: {orderBooks: ""}
    },
    created: function() {
        this.loadItems();
    },
    methods: {
        loadItems: function() {
            api.getAllItems()
                .then(response => response.json())
                .then(json => {
                    this.items = JSON.parse(JSON.stringify(json));

                })
        },

        selectItem: function(id) {
            api.getOrderHistory(id)
                .then(response => response.json())
                .then(json => {
                    this.currentItem = JSON.parse(JSON.stringify(json));
                })
        },

        postOrderBooks: function() {
            console.log(this.post);
            let orderBooks = parseOrderBooks(this.post.orderBooks);
        
            if(validateOrderBooks(orderBooks)){
                api.appendToOrderHistory(orderBooks)
            }
        }
    },



});

//helpers

function parseOrderBooks(orderBooks) {
    orderBooks = JSON.parse(orderBooks);
    if(orderBooks.marketItemOrderBooks) {
        orderBooks = orderBooks.marketItemOrderBooks;
    }
    if(orderBooks.itemHrid) {
        orderBooks.itemHrid = orderBooks.itemHrid.substring(1);
        orderBooks.itemHrid = orderBooks.itemHrid.replaceAll('/', '-')
    }
    return orderBooks;
}

function validateOrderBooks(orderBooks) {
    if(orderBooks.itemHrid && orderBooks.orderBooks) {
        return true;
    }
    return false;
}