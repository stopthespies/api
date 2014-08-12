var express = require('express');
var app = express();
var MongoClient = require('mongodb').MongoClient;
var cors = require('cors')

var log = require('./log');
var tweets = require('./tweets');
var stats = require('./stats');
var email = require('./email');

app.use(cors());


MongoClient.connect(process.env.MONGOHQ_URL, function(err, db) {
    if (err) throw err;
    var totalsCollection = db.collection('totals');
    var tweetsCollection = db.collection('tweets');

    app.get('/', function(req, res) {
        res.send({
            message: 'hello world.'
        });
    });
    app.get('/stats', stats); // Retrieve statistics

    app.get('/log', log); // Used for logging

    app.get('/tweets', tweets);

    app.post('/email', email);



    var port = Number(process.env.PORT || 5000);
    app.listen(port, function() {
        console.log('Listening on ' + port);
    });
});


