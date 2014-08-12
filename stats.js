var mongo = require(__dirname + '/lib/database');

module.exports = function(req, response) {
	mongo.get().then(function(db) {
		db.collection('log_totals').find({_id : 'overall_totals'}, function(err, res) {
			if (err) {
				response.jsonp(false);
				throw err;
			}
			res.toArray(function(err, res) {
				response.jsonp(res[0]);
			});
		});
	}, function(err) {
		throw err;
	});
};
