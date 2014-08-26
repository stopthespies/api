// deps
var app = require('express.io')();
var cors = require('cors');
var mongo = require(__dirname + '/lib/database');
var config = require(__dirname + '/_config_');

// request handlers
var log = require('./log');
var tweets = require('./tweets');
var stats = require('./stats');
var email = require('./email');

//------------------------------------------------------------------------------

app.use(cors());
app.http().io();

mongo.get().then(function(db) {
	// server index
    app.get('/', function(req, res) {
        res.send('StopTheSpies API server <a href="http://stopthespies.org">http://stopthespies.org</a>');
    });

	// Retrieve global aggregate statistics
    app.get('/stats', function(req, res) {
    	stats.call(app, req, res);
	});

    // Read supporter tweets
    app.get('/tweets', function(req, res) {
    	tweets.call(app, req, res);
	});

    // Log events
    app.get('/log', function(req, res) {
    	log.call(app, req, res);
	});

	// Send campaign emails
    app.post('/email', function(req, res) {
    	email.call(app, req, res);
	});

	//--------------------------------------------------------------------------
	// Run server

    var port = config.server_port || 5000;
    app.listen(port, function() {
        console.log('Listening on ' + port);
    });
}, function(err) {
	throw err;
});


