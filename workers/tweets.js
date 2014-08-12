/**
 * Bring down the tweets to the locals and parse them for relevance
 */

var RUN_INTERVAL = 15000;
var TWEETS_MATCH = '#RobinWilliams';

//------------------------------------------------------------------------------

var async = require('async');
var Twit = require('twit');
var MongoClient = require('mongodb').MongoClient;

var twit = new Twit({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_SECRET
});

//------------------------------------------------------------------------------

MongoClient.connect(process.env.MONGOHQ_URL, function(err, db) {
    if (err) throw err;

    process.nextTick(function() {
    	startProcess(db);
    });
});

function startProcess(db)
{
	db.collection('worker_state').find({_id : 'last_tweet'}, function(err, res) {
		if (err) throw err;

		res.toArray(function(err, res) {
			if (err) throw err;

			var lastOffset = res.length ? res[0].value : 0;

			setImmediate(function() {
				loadTweets(db, lastOffset);
			});
		});
	});
}

function loadTweets(db, lastOffset)
{
	console.log('Check tweets [offset ' + lastOffset + ']...');

	function parseTwitterDate(text)
	{
		return new Date(Date.parse(text.replace(/( +)/, ' UTC$1')));
	}

	twit.get('search/tweets', { q: TWEETS_MATCH, count: 100, since_id: lastOffset }, function(err, data, response) {
    	if (err) throw err;

    	console.log('Found ' + data.statuses.length + '.');

    	var coll = db.collection('tweets');
    	var maxId = lastOffset;

    	if (!data.statuses.length) {
    		finaliseRun(db, maxId);
    	} else {
	    	// check and find last ID
	    	data.statuses.forEach(function(status) {
    			if (status.id > maxId) {
    				maxId = status.id;
    			}
	    	});

    		// save all at once
	    	coll.insert(data.statuses.map(function(status) {
	    		var u = status.user;
	    		return {
	    			_id : "" + status.id,
	    			created_at : parseTwitterDate(status.created_at),
	    			text : status.text,
	    			user : {
	    				id : u.id,
	    				name : u.name,
	    				screen_name : u.screen_name,
	    				location : u.location,
	    				description : u.description,
	    				url : u.url,
	    				followers_count : u.followers_count,
	    				friends_count : u.friends_count,
	    				time_zone : u.time_zone,
	    				profile_image_url : u.profile_image_url.replace(/^https?:/i, ''),
	    			},
	    		};
	    	}), {w : 1}, function(err, res) {
	    		if (err) throw err;

	    		finaliseRun(db, maxId);
	    	});
    	}
    });
}

function finaliseRun(db, newOffset)
{
	db.collection('worker_state').save({_id: 'last_tweet', value: newOffset}, {w : 1}, function(err, res) {
		if (err) throw err;

		console.log('Done. New offset is ' + newOffset);

		setTimeout(function() {
			startProcess(db);
		}, RUN_INTERVAL);
	});
}

