/**
 * Config for backend limits, thresholds, database etc
 * Also a layer of indirection above env variables to allow easy overrides during dev.
 */
module.exports = {
	server_ssl : !(process.env.SKIP_SSL || true),	// defaulting to off as Heroku manages this internally
	ssl_key_path : process.env.SSL_KEY_FILE,
	ssl_cert_path : process.env.SSL_CERT_FILE,
	server_port : process.env.PORT,
	broadcast_logs_interval : process.env.SOCKET_BROADCAST_THROTTLE || 1000,	// how often to query latest global events and send to clients
	mongo_connection_uri : process.env.MONGOHQ_URL,

	tweet_follower_celebrity_count : 10,
	tweets_per_page : 40,

	tweet_processor_interval : 15000,
	tweet_processor_batch_size : 100,
	tweet_processor_match : 'battleforthenet.com OR #internetslowdown OR #battleforthenet',
	tweet_processor_account_blacklist : [

	],

	twitterCreds : {
		consumer_key: process.env.TWITTER_CONSUMER_KEY,
		consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
		access_token: process.env.TWITTER_ACCESS_TOKEN,
		access_token_secret: process.env.TWITTER_ACCESS_SECRET
	},

	share_stats_url : 'https://d28jjwuneuxo3n.cloudfront.net/?networks=facebook,twitter,googleplus&url=https://stopthespies.org',
	share_stats_poll_interval : 5000,

	mongoSetup : {
		// configure collections to prepopulate
		collectionsAndIndexes : {
			worker_state : [],
			log_totals : [
				{ calls : 1 },
				{ emails : 1 },
				{ views : 1 },
				{ visits : 1 },
			],
			log_event_times : [
				{ time : 1 },
				{ type : 1 },
				{ legislator : 1 },
				{ isRepeat : 1 },
			],
			tweets : [
				{ "user.followers_count" : 1 },
				{ "user.screen_name" : 1 },
			],
		},
		// configure records to prepopulate
		collectionRecords : {
			log_totals : [
				{ _id : 'overall_totals' }
			],
		},
		totalsTable : 'log_totals',	// this array of collectionRecords gets legislator ids appended to it
	},
};
