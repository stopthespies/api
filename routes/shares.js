/**
 * Share count endpoint, cache / broadcaster
 *
 * @package  StopTheSpies API
 * @author   Sam Pospischil <pospi@spadgos.com>
 * @since    2014-09-26
 */

var config = require(__dirname + '/../_config_');

var request = require("request");

//------------------------------------------------------------------------------

var counts;

//------------------------------------------------------------------------------

function getCounts(req)
{
	var app = this;

	request(config.share_stats_url, function(err, resp, body) {
		if (err) {
			sendCounts(req, false);
			console.error('Request error: ', err);
			return;
		}

		var newCounts;

		try {
			newCounts = JSON.parse(body);
		} catch (e) {
			sendCounts(req, false);
			console.error('Bad response: ', body);
			return;
		}

		// if changed, broadcast to all clients (except connected, if this is run as a result of someone's request)
		if (!counts
		 || newCounts.facebook != counts.facebook
		 || newCounts.facebook != counts.facebook
		 || newCounts.facebook != counts.facebook) {
		 	console.log('Shares changed: broadcasting');
			(req ? req : app).io.broadcast('shares:update', newCounts);
		}

		counts = newCounts;

		if (req) {
			sendCounts(req, counts);
		}

		setTimeout(function() {
			getCounts.call(app);
		}, config.share_stats_poll_interval);
	});

}

function sendCounts(req, counts)
{
	req.io.respond(counts);
}

module.exports = function(req) {
	if (!counts) {
		getCounts.call(this, req);
	} else {
		sendCounts(req, counts);
	}
};
