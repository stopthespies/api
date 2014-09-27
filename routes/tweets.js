/**
 * Querystring parameters:
 *
 * - page: paging offset for reads. Most useful when combined with 'filter'.
 * - filter: subset of results to return. When ommitted, all tweets are returned ordered by time.
 *   possible filter values:
 *       - latest: returns all tweets ordered by date (same as no filter)
 *       - followers: returns all tweets ordered by followers
 *       - normal: returns tweets for normal users only, ordered by date
 *       - celebs: returns tweets for celebrity users only, ordered by follower count
 *       - reps: returns tweets for legislators, ordered by date
 *
 * Returned data:
 *
 * Results always include a total tweet count under `count`.
 * Each filter resultset will be provided in the `results` object, in a subkey of the same name as the filter.
 *
 * for example:
 * {
 *   "results" : {
 *   	"latest" : [...],
 *   	"reps" : [...]
 *   },
 *   "count": 1000
 * }
 *
 * The first page of results for each tweet type are cached in memory and
 * reloaded at the same interval the tweet worker runs at.
 *
 * :TODO: featured tweets
 */

var mongo = require(__dirname + '/../lib/database');
var config = require(__dirname + '/../_config_');
var async = require('async');

var memberCSV = require('au-legislator-contacts-csv');

//------------------------------------------------------------------------------

var TWEETCACHE = null;

function formatTweet(tweet)
{
	return {
		tweet: tweet.text,
		handle: tweet.user.screen_name,
		name: tweet.user.name,
		avatar: tweet.user.profile_image_url,
		link: 'https://twitter.com/#!/' + tweet.user.id + '/status/' + tweet._id + '/',
		retweet_link: 'https://twitter.com/intent/retweet?tweet_id=' + tweet._id,
		followers: tweet.user.followers_count
	}
}

function formatResponse(results)
{
	var count = results.pop();

	return {
		'results' : results.reduce(function(accum, val) {
			for (var i in val) {
				accum[i] = val[i];
			}
			return accum;
		}, {}),
		'offset' : 0,	// :TODO: when we need paging
		'total' : count,
	};
}

function __search(db, filter, readOffset, callback)
{
	memberCSV.get().then(function(members) {

		// reduce members down to twatter names
		members = members.map(function(m) {
			return m.twitter ? m.twitter.match(/https?:\/\/(www\.)?twitter.com\/(#!\/)?(.*?)(\/|$)/)[3] : false;
		}).filter(function(m) {
			return !!m;
		});

		// define queries

		function queryLatest(cb)
		{
			db.collection('tweets').find({}, {}, {
				sort : [["created_at", 'desc']],
				limit : config.tweets_per_page,
				skip : readOffset,
			}, function(err, res) {
				if (err) { cb(err); return; }

				res.toArray(function(err, docs) {
					if (err) { cb(err); return; }

					cb(null, {
						'latest' : docs.map(formatTweet)
					});
				});
			});
		}

		function queryByFollowers(cb)
		{
			db.collection('tweets').find({}, {}, {
				sort : [["user.followers_count", 'desc']],
				limit : config.tweets_per_page,
				skip : readOffset,
			}, function(err, res) {
				if (err) { cb(err); return; }

				res.toArray(function(err, docs) {
					if (err) { cb(err); return; }

					cb(null, {
						'followers' : docs.map(formatTweet)
					});
				});
			});
		}

		function queryNormal(cb)
		{
			db.collection('tweets').find({
				"user.followers_count": {$lt : config.tweet_follower_celebrity_count},
				"user.screen_name": {$nin : members}
			}, {}, {
				sort : [["created_at", 'desc']],
				limit : config.tweets_per_page,
				skip : readOffset,
			}, function(err, res) {
				if (err) { cb(err); return; }

				res.toArray(function(err, docs) {
					if (err) { cb(err); return; }

					cb(null, {
						'normal' : docs.map(formatTweet)
					});
				});
			});
		}

		function queryCelebs(cb)
		{
			db.collection('tweets').find({
				"user.followers_count": {$gte : config.tweet_follower_celebrity_count},
				"user.screen_name": {$nin : members}
			}, {}, {
				sort : [["user.followers_count", 'desc']],
				limit : config.tweets_per_page,
				skip : readOffset,
			}, function(err, res) {
				if (err) { cb(err); return; }

				res.toArray(function(err, docs) {
					if (err) { cb(err); return; }

					cb(null, {
						'celebs' : docs.map(formatTweet)
					});
				});
			});
		}

		function queryReps(cb)
		{
			db.collection('tweets').find({
				"user.screen_name": {$in : members}
			}, {}, {
				sort : [["created_at", 'desc']],
				limit : config.tweets_per_page,
				skip : readOffset,
			}, function(err, res) {
				if (err) { cb(err); return; }

				res.toArray(function(err, docs) {
					if (err) { cb(err); return; }

					cb(null, {
						'reps' : docs.map(formatTweet)
					});
				});
			});
		}

		function getCount(cb)
		{
			db.collection('tweets').count(cb);
		}

		// choose queries based on filter

		var queries;
		if (!filter) {
			queries = [queryByFollowers];
		} else {
			if (filter['latest']) {
				queries.push(queryLatest);
			}
			if (filter['followers']) {
				queries.push(queryByFollowers);
			}
			if (filter['normal']) {
				queries.push(queryNormal);
			}
			if (filter['celebs']) {
				queries.push(queryCelebs);
			}
			if (filter['reps']) {
				queries.push(queryReps);
			}
		}

		queries.push(getCount);	// :IMPORTANT: counts must be last

		// run queries

		async.parallel(queries, function(err, res) {
			callback(err, res);

			// poll for new tweets at same interval as parse worker
			if (!filter && !readOffset) {
				setTimeout(function() {
					__search(db, filter, readOffset, function(err, res) {
						if (err) { throw err; }
						TWEETCACHE = formatResponse(res);

						// :TODO: broadcast updates
					});
				}, config.tweet_processor_interval);
			}
		});

	}, function(err) {
		callback(err);
	});
}

//------------------------------------------------------------------------------

module.exports = function(req)
{
	var self = this;
	var readOffset = Math.max(0, ((self.input(req, 'page') || 1) - 1) * config.tweets_per_page);
	var filter = self.input(req, 'filter') || false;

	// read from cache if possible
	if (!readOffset && !filter && TWEETCACHE) {
		req.io.respond(TWEETCACHE);
		return;
	}

	mongo.get().then(function(db) {

		__search(db, filter, readOffset, function(err, results) {
			if (err) throw err;

			var tweets = formatResponse(results);

		    req.io.respond(tweets);

		    // cache for later if this is a default landing page request
			if (!readOffset && !filter) {
				TWEETCACHE = tweets;
			}
		});

	}, function(err) {
		throw err;
	});

};
