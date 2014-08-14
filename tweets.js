var mongo = require(__dirname + '/lib/database');
var config = require(__dirname + '/_config_');
var _ = require('lodash');

module.exports = function(req, res) {
	mongo.get().then(function(db) {
		// :TODO: pull and cache legislator twitter details to fill user category
		// :TODO: limit response size & order by time

		db.collection('tweets').find({}).toArray(function(err, docs) {
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
		    res.jsonp(tweets);

        });

        /*
		var tweets = [{
			tweet: 'I think we should eat book cases #stopthespies What do you think?',
			handle: 'neutralthoughts',
			avatar: 'https://pbs.twimg.com/profile_images/488579015507050497/QvG1ArTx_400x400.jpeg',
			link: 'https://twitter.com/neutralthoughts/status/499062476063776768',
			category: 'politician',
			followers: 1000
		}];
		*/
	}, function(err) {
		throw err;
	});

};
