/**
 * Config for backend limits, thresholds, database etc
 * Also a layer of indirection above env variables to allow easy overrides during dev.
 */
module.exports = {
	mongo_connection_uri : process.env.MONGOHQ_URL,

	tweet_follower_celebrity_count : 10000,

	tweet_processor_interval : 15000,
	tweet_processor_batch_size : 100,
	tweet_processor_match : '#ausprivacy',

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
