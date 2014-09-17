var mongo = require(__dirname + '/../lib/database');

module.exports = function(req) {
	var search_record = {_id : 'overall_totals'};

	if (req.data && req.data.legislators) {
		search_record = {_id : {$in : req.data.legislators}};
	}
	req.data.legislators.forEach(function(legislator){
		db.collection('log_totals').insert({
			_id: legislator,
			calls: 0,
			facebooks: 0,
			views: 0,
			tweets: 0,
			emails: 0
		}, function(err, res) {
            if (err) {
                console.warn("Mongo log write failed:", eventLog);
                return;
            }
        });
	});
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
