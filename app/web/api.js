function getAllItems() {
    const options = {}
    options.method = 'GET';
    options.mode = 'cors';
    options.headers = {'Content-Type': 'application/json'}
    return fetch("api/items", options)
}

function getOrderHistory(id) {
    const options = {}
    options.method = 'GET';
    options.mode = 'cors';
    options.headers = {'Content-Type': 'application/json'}
    return fetch(`api/orderHistory/${id}`, options)
}

function appendToOrderHistory(orderBooks) {
    const options = {}
    options.method = 'POST';
    options.mode = 'cors';
    options.headers = {'Content-Type': 'application/json'}
    options.body = JSON.stringify(orderBooks)
    return fetch(`api/orderHistory`, options)
}

export const api = {getAllItems, getOrderHistory, appendToOrderHistory}
