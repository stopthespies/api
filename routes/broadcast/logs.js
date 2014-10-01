/**
 * Log event broadcaster.
 *
 * This layer allows us to broadcast periodical updates to the counter stats
 * independently of writes (which use increment operations).
 *
 * @package  StopTheSpies API
 * @author   Sam Pospischil <pospi@spadgos.com>
 * @since    2014-08-30
 */

var async = require('async');
var mongo = require(__dirname + '/../../lib/database');

var theTotals = null;

function send(app, totals)
{
	console.log('Broadcast stats');
	app.io.broadcast('stats:update', totals);

	theTotals = totals;
}

module.exports = function(app, delay)
{
  mongo.get().then(function(db) {
    setTimeout(function pollStats() {
      db.collection('log_totals').find({}, {sort: '_id'}, function(err, res) {
        if (err) throw err;
        res.toArray(function(err, totals) {
          if (err) throw err;

          if (!theTotals) {
	          send(app, totals);
          } else {
	          for (var i = 0, l = totals.length; i < l; ++i) {
	          	if (theTotals[i].visits !== totals[i].visits ||
	          	  theTotals[i].views !== totals[i].views ||
	              theTotals[i].emails !== totals[i].emails ||
	              theTotals[i].calls !== totals[i].calls ||
	              theTotals[i].tweets !== totals[i].tweets ||
	              theTotals[i].facebooks !== totals[i].facebooks) {
	          		send(app, totals);
		          	break;
	          	}
	          }
	      }

          setTimeout(pollStats, delay);
        });
      });
    }, delay);
  });
};
