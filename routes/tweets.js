var mongo = require(__dirname + '/../lib/database');
var config = require(__dirname + '/../_config_');
var _ = require('lodash');
var async = require('async');


function __search(db, query, options, callback)
{
	db.collection('tweets').find(query, options || null, function(err, res) {
		if (err) {
			callback(err);
			return;
		}
		res.toArray(function(err, docs) {
			if (err) {
				callback(err);
				return;
			}

	        var tweets = _.map(docs, function(tweet){
	        	return {
					tweet: tweet.text,
					handle: tweet.user.screen_name,
					avatar: tweet.user.profile_image_url,
					link: 'https://twitter.com/#!/' + tweet.user.id + '/status/' + tweet._id + '/',
					retweet_link: 'https://twitter.com/intent/retweet?tweet_id=' + tweet._id,
					category: 'politician',	// :TODO:
					followers: tweet.user.followers_count
	        	}
	        });

	        callback(null, tweets);
		});
	});
}

// :TODO: pull and cache legislator twitter details to query against tweets

module.exports = function(req) {
	mongo.get().then(function(db) {
		var searchOptions = {sort : [["created_at", 'desc']], limit : 200};	// :TODO: make configurable

		var queries = [
			// normal users
			[{"user.followers_count": {$lt : config.tweet_follower_celebrity_count}}, searchOptions],
			// celebs
			[{"user.followers_count": {$gte : config.tweet_follower_celebrity_count}}, searchOptions],
			// :TODO: legislators
			[{}, searchOptions],
			// :SHONK: this one is the thing I'm going to use to make a count()
			'COUNT'
		];

		async.map(queries, function(query, callback) {
			if ('COUNT' === query) {
				db.collection('tweets').count(callback);
			} else {
				__search(db, query[0], query[1], callback);
			}
		}, function(err, results) {
			if (err) throw err;

			var tweets = {
				'latest' : {
					'public' : results[0],
					'celebrities' : results[1],
					'legislators' : results[2], // :TODO:
				},
				'offset' : 0,	// :TODO: when we need paging
				'total' : results[3],
			};
		    req.io.emit('get_tweets', tweets);
		});
	}, function(err) {
		throw err;
	});

};
