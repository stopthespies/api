// deps
var app = require('express.io')();
var cors = require('cors');
var mongo = require(__dirname + '/lib/database');
var config = require(__dirname + '/_config_');

var bodyParser = require('body-parser');

// request handlers
var log = require(__dirname + '/routes/log');
var tweets = require(__dirname + '/routes/tweets');
var stats = require(__dirname + '/routes/stats');
var email = require(__dirname + '/routes/email');
var websites = require(__dirname + '/routes/websites');

// io event broadcasters
var logBroadcaster = require(__dirname + '/routes/broadcast/logs');

//------------------------------------------------------------------------------

app.use(cors());
app.use(bodyParser.json())
app.http().io();

mongo.get().then(function(db) {
	//--------------------------------------------------------------------------
	// standard routes

	// index has some links
    app.get('/', function(req, res) {
        res.send('<h3>StopTheSpies API server</h3> \
        		<a href="https://stopthespies.org">https://stopthespies.org</a> \
        		<a href="https://github.com/stopthespies/">https://github.com/stopthespies/</a>');
    });

	// emails are sent via POST
    app.post('/email', function(req, res) {
    	email.call(app, req, res);
	});

	// expose some JSON endpoints as APIs
    app.get('/stats', function(req, res) {
    	req.io.route('stats');
	});
    app.get('/tweets', function(req, res) {
    	req.io.route('tweets');
	});

    app.post('/websites', function(req, res) {
    	req.io.route('websites');
	});

	//--------------------------------------------------------------------------
	// socket events

	// read global stats
	app.io.route('stats', function(req) {
		console.log('read stats');
    	stats.call(app, req);
	});

	// read tweets
	app.io.route('tweets', function(req) {
		console.log('read tweets');
    	tweets.call(app, req);
	});

    // log events
    app.io.route('log', function(req) {
    	log.call(app, req);
	});


    // website events
    app.io.route('websites', function(req) {
    	websites.call(app, req);
	});

	//--------------------------------------------------------------------------
	// broadcast daemons

	logBroadcaster.call(app);

	//--------------------------------------------------------------------------
	// init server

    var port = config.server_port || 5000;
    app.listen(port, function() {
        console.log('Listening on ' + port);
    });
}, function(err) {
	throw err;
});


