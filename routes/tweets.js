var mongo = require(__dirname + '/../lib/database');
var config = require(__dirname + '/../_config_');
var async = require('async');

var memberCSV = require('au-legislator-contacts-csv');


function __search(db, query, options, callback)
{

	//db.collection('tweets').find(query, options || null, function(err, res) {


	/*

	db.collection('tweets').aggregate([
	   {$group: {
	       _id : {id : "$user.id", followers: "$user.followers_count" },
	       count : { $sum : 1 },
	       tweets : { $push : { id : "$_id", time : "$created_at", text : "$text"}}
	   }},
	   {
	       $sort: {
	           "_id.followers" : -1
	       }
	   }
	], callback)

*/
	db.collection('tweets').find(query, {}, options || null, function(err, res) {
		if (err) {
			callback(err);
			return;
		}
		res.toArray(function(err, docs) {
			if (err) {
				callback(err);
				return;
			}

	        var tweets = docs.map(function(tweet){
	        	return {
					tweet: tweet.text,
					handle: tweet.user.screen_name,
					name: tweet.user.name,
					avatar: tweet.user.profile_image_url,
					link: 'https://twitter.com/#!/' + tweet.user.id + '/status/' + tweet._id + '/',
					retweet_link: 'https://twitter.com/intent/retweet?tweet_id=' + tweet._id,
					followers: tweet.user.followers_count
	        	}
	        });

	        callback(null, tweets);
		});
	});
}

// :TODO: pull and cache legislator twitter details to query against tweets

module.exports = function(req) {
	var self = this;

	mongo.get().then(function(db) {
	memberCSV.get().then(function(members) {


		// reduce members down to twatter names
		members = members.map(function(m) {
			return m.twitter ? m.twitter.match(/https?:\/\/(www\.)?twitter.com\/(#!\/)?(.*?)(\/|$)/)[3] : false;
		}).filter(function(m) {
			return !!m;
		});

		var searchOptions = {
			sort : [["user.followers_count", 'desc']],
			limit : config.tweets_per_page,
			skip : Math.max(0, ((self.input(req, 'page') || 1) - 1) * config.tweets_per_page),
		};

		var queries = [
			// normal users
			[{
				"user.followers_count": {$lt : config.tweet_follower_celebrity_count},
				"user.screen_name": {$in : members}, // TODO - change back to nin HACK
			}, searchOptions],
			// celebs
			[{
				"user.followers_count": {$gte : config.tweet_follower_celebrity_count},
				"user.screen_name": {$nin : members},
			}, searchOptions],
			[{
				"user.screen_name": {$in : members}
			}, searchOptions],
			// :SHONK: random string ID used to change inner behaviour of the below
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
					//'public' : results[0],
					'celebrities' : results[1]
					//'legislators' : results[2],
				},
				'offset' : 0,	// :TODO: when we need paging
				'total' : results[3],
			};
		    req.io.respond(tweets);
		});


	}, function(err) {
		throw err;
	})}, function(err) {
		throw err;
	});

};
