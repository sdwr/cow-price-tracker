const SERVER_URL = 'http://localhost:8080/api'

function getAllItems() {
    const options = {}
    options.method = 'GET';
    options.mode = 'cors';
    options.headers = {'Content-Type': 'application/json'}
    return fetch(SERVER_URL + "/items", options)
}

function getOrderHistory(id) {
    const options = {}
    options.method = 'GET';
    options.mode = 'cors';
    options.headers = {'Content-Type': 'application/json'}
    return fetch(SERVER_URL + `/orderHistory/${id}`, options)
}

function appendToOrderHistory(orderBooks) {
    const options = {}
    options.method = 'POST';
    options.mode = 'cors';
    options.headers = {'Content-Type': 'application/json'}
    options.body = JSON.stringify(orderBooks)
    return fetch(SERVER_URL + `/orderHistory/${orderBooks.itemHrid}`, options)
}

export const api = {getAllItems, getOrderHistory, appendToOrderHistory}
