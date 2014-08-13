/**
 * Bring down the tweets to the locals and parse them for relevance
 */

var config = require(__dirname + '/../_config_');

var RUN_INTERVAL = config.tweet_processor_interval;
var TWEETS_MATCH = config.tweet_processor_match;

//------------------------------------------------------------------------------

var async = require('async');
var Twit = require('twit');
var mongo = require(__dirname + '/../lib/database');

var twit = new Twit(config.twitterCreds);

//------------------------------------------------------------------------------

mongo.get().then(function(db) {
    process.nextTick(function() {
    	startProcess(db);
    });
}, function(err) {
	throw err;
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

	twit.get('search/tweets', { q: TWEETS_MATCH, count: config.tweet_processor_batch_size, since_id: lastOffset }, function(err, data, response) {
    	if (err) throw err;

    	console.log('Found ' + data.statuses.length + '.');

    	var coll = db.collection('tweets');
    	var maxId = lastOffset;
    	var writesInProgress = 0;

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
	    	data.statuses.forEach(function(status) {
    		(function() {
    			++writesInProgress;
	    		var u = status.user;
	    		var tweet = {
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
	    		coll.save(tweet, {w : 1}, function(err, res) {
		    		if (err) throw err;

		    		if (--writesInProgress == 0) {
			    		finaliseRun(db, maxId);
			    	}
		    	});
		    })();
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

