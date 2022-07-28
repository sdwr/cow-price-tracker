require('app-module-path').addPath(__dirname);
require('dotenv').config();
const express = require('express');

const cors = require('cors');
const http = require('http');
const bodyParser = require('body-parser');
const moment = require('moment');

require('./models/orderHistory');
require('./models/playerInventory');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


app.use(express.static(__dirname + '/web'));
app.use(express.static(__dirname + "/assets"));
app.use(require('./routes'));

let db = require("./mongo/db");
const server = http.createServer(app);



//run server
server.listen(process.env.PORT || 8080, function init() {
	console.log(`server started on port ${server.address().port}`);
});

