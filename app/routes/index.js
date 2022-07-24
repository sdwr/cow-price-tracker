const router = require('express').Router();

router.use('/api', require('./api/orderHistory'));

module.exports = router;