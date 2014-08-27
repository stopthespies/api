var mongo = require(__dirname + '/../lib/database');

module.exports = function(req) {
	mongo.get().then(function(db) {
		db.collection('log_totals').find({_id : 'overall_totals'}, function(err, res) {
			if (err) {
				req.io.respond(false);
				console.warn("Error reading mongo (totals):", err);
				return;
			}
			res.toArray(function(err, res) {
				req.io.respond(res[0]);
			});
		});
	}, function(err) {
		throw err;
	});
};
