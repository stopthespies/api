var mongo = require(__dirname + '/../lib/database');
var config = require(__dirname + '/../_config_');
var _ = require('lodash');

module.exports = function(req) {
	mongo.get().then(function(db) {
		var info = req.body;
		db.collection('websites').insert(info, {w: 1}, function(err, records){
			req.io.respond(records);
		});

	});

};
