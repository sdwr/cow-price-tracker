const mongoose = require('mongoose');

const ErrorLogSchema = new mongoose.Schema({
    failedCount: Number,
    failedRequests: [Object]

});

module.exports = mongoose.model('ErrorLog', ErrorLogSchema);