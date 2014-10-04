var mongo = require(__dirname + '/../lib/database');

var StatCache = require(__dirname + '/../lib/stats-cache');

module.exports = function(req) {
	var search_record = {};		// load all by default. There aren't that many members.

	var cached = StatCache.get();

	if (this.input(req, 'legislators')) {
		search_record = {_id : {$in : this.input(req, 'legislators')}};
	} else if (cached) {
		req.io.respond(cached);
		return;
	}

	mongo.get().then(function(db) {
		db.collection('log_totals').find(search_record, function(err, res) {
			if (err) {
				req.io.respond(false);
				console.warn("Error reading mongo (totals):", err);
				return;
			}
			res.toArray(function(err, res) {
				req.io.respond(res);
			});
		});
	}, function(err) {
		throw err;
	});
};
