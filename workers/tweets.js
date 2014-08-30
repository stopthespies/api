
var mongo = require(__dirname + '/../lib/database');

var config = require(__dirname + '/../_config_');

var worker = require('tweets-mongodb-parser');


mongo.get().then(function(db) {
    process.nextTick(function() {
    	new worker(db, {
    		creds : config.twitterCreds,
    		match : config.tweet_processor_match,
    		check_interval : config.tweet_processor_interval,
    		batch_size : config.tweet_processor_batch_size,
    		account_blacklist : config.tweet_processor_account_blacklist,
    	}).start();
    });
}, function(err) {
	throw err;
});
