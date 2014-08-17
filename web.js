var app = require('express.io')();
var cors = require('cors')

var log = require('./log');
var tweets = require('./tweets');
var stats = require('./stats');
var email = require('./email');

var mongo = require(__dirname + '/lib/database');
var config = require(__dirname + '/_config_');

app.use(cors());
app.http().io();


mongo.get().then(function(db) {

    app.get('/', function(req, res) {
        res.send({
            message: 'hello world.'
        });
    });
    app.get('/stats', stats); // Retrieve global aggregate statistics

    app.get('/log', log); // Used for logging

    app.get('/tweets', tweets);	// Read supporter tweets

    app.post('/email', email);	// Send campaign email

    var port = config.server_port || 5000;
    app.listen(port, function() {
        console.log('Listening on ' + port);
    });
}, function(err) {
	throw err;
});


