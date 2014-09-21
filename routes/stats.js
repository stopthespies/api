var mongo = require(__dirname + '/../lib/database');

module.exports = function(req) {
	var search_record = {};		// load all by default. There aren't that many members.

	if (req.data && req.data.legislators) {
		search_record = {_id : {$in : req.data.legislators}};
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
