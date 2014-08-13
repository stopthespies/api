/**
 * MongoDB wrapper (reuse single connection)
 */

var config = require(__dirname + '/../_config_');
var Promise = require('promise');
var MongoClient = require('mongodb').MongoClient;

var promise;

module.exports = {
	get : function() {
		if (!promise) {
			promise = new Promise(function(resolve, reject) {
				console.log('Mongo connecting...');

				MongoClient.connect(config.mongo_connection_uri, function(err, db) {
					console.log('Mongo OK.');
					if (err) reject(err);
					else resolve(db);
				});
			});
		}

		return promise;
	}
};
