var MongoClient = require('mongodb').MongoClient;
var _ = require('lodash');

module.exports = function(req, res) {
	MongoClient.connect(process.env.MONGOHQ_URL, function(err, db) {
		if (err) throw err;
		db.collection('tweets').find({"followers_count": {$gt: 10000}}).toArray(function(err, docs) {
			console.log(docs);
	        var tweets = _.map(docs, function(tweet){
	        	return {
					tweet: tweet.text,
					handle: tweet.user.screen_name,
					avatar: tweet.user.profile_image_url,
					link: 'https://twitter.com/neutralthoughts/status/499062476063776768',
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
	});

};
