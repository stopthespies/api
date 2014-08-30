/**
 * Config for backend limits, thresholds, database etc
 * Also a layer of indirection above env variables to allow easy overrides during dev.
 *
 * :TODO: prepopulate legislator info into mongo from source data
 */
module.exports = {
	server_port : process.env.PORT,
	broadcast_logs_interval : process.env.SOCKET_BROADCAST_THROTTLE || 1000,	// how often to query latest global events and send to clients
	mongo_connection_uri : process.env.MONGOHQ_URL,

	tweet_follower_celebrity_count : 10,

	tweet_processor_interval : 15000,
	tweet_processor_batch_size : 100,
	tweet_processor_match : 'data retention',
	tweet_processor_account_blacklist : [

	],

	twitterCreds : {
		consumer_key: process.env.TWITTER_CONSUMER_KEY,
		consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
		access_token: process.env.TWITTER_ACCESS_TOKEN,
		access_token_secret: process.env.TWITTER_ACCESS_SECRET
	},

	mongoSetup : {
		// configure collections to prepopulate
		collectionsAndIndexes : {
    	worker_state : [],
      log_totals : [
        { calls : 1 },
        { emails : 1 },
        { views : 1 },
      ],
      log_event_times : [
        { time : 1 },
        { type : 1 },
      ],
			tweets : [
				{ followers_count : 1 },
      ],
    },
    // configure records to prepopulate
    collectionRecords : {
    	log_totals : [
    		{ _id : 'overall_totals' }
    	],
    },
  },
};
