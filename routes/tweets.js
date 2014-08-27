var mongo = require(__dirname + '/../lib/database');
var config = require(__dirname + '/../_config_');
var _ = require('lodash');

module.exports = function(req) {
	mongo.get().then(function(db) {
		// :TODO: pull and cache legislator twitter details to fill user category
		// :TODO: move this munging code to the processor to make reads quicker and limit the tweet metadata we're storing
		// :TODO: limit response size & order by time
		var options = {
		    "limit": 200,
		    "sort": [["user.followers_count", "desc"]]
		}
		db.collection('tweets').find({}, options).toArray(function(err, docs) {
		//db.collection('tweets').find({"user.followers_count": {$gt: config.tweet_follower_celebrity_count}}).toArray(function(err, docs) {
			console.log(docs);

	        var tweets = _.map(docs, function(tweet){
	        	return {
					tweet: tweet.text,
					handle: tweet.user.screen_name,
					avatar: tweet.user.profile_image_url,
					link: 'https://twitter.com/#!/' + tweet.user.id + '/status/' + tweet._id + '/',
					retweet_link: 'https://twitter.com/intent/retweet?tweet_id=' + tweet._id,
					category: 'politician',
					followers: tweet.user.followers_count
	        	}
	        });
	        console.log(tweets);
		    req.io.respond(tweets);

        });
	}, function(err) {
		throw err;
	});

};
