var express = require('express');
var app = express();
var MongoClient = require('mongodb').MongoClient;

var log = require('./log');
var tweets = require('./tweets');


MongoClient.connect(process.env.MONGOHQ_URL, function(err, db) {
    if (err) throw err;
    var totalsCollection = db.collection('totals');
    var tweetsCollection = db.collection('tweets');

    app.get('/', function(req, res) {
        res.send({
            message: 'hello world.'
        });
    });

    app.get('/log', log);

    app.get('/tweets', tweets);

    var port = Number(process.env.PORT || 5000);
    app.listen(port, function() {
        console.log('Listening on ' + port);
    });
});