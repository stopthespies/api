var mongo = require(__dirname + '/../lib/database');

module.exports = function(req) {
	var search_record = {_id : 'overall_totals'},
		response_event = 'get_stats';

	if (req.data && req.data.legislators) {
		search_record = {_id : {$in : req.data.legislators}};
		response_event = 'legislator_stats';
	}

	mongo.get().then(function(db) {
		db.collection('log_totals').find(search_record, function(err, res) {
			if (err) {
				req.io.emit(response_event, false);
				// req.io.respond(false);	// :TODO: check how to return data for both normal HTTP request and socket
				console.warn("Error reading mongo (totals):", err);
				return;
			}
			res.toArray(function(err, res) {
				req.io.emit(response_event, res);
				// req.io.respond(res[0]);
			});
		});
	}, function(err) {
		throw err;
	});
};
