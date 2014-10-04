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

var StatCache = require(__dirname + '/../../lib/stats-cache');

function send(app, changes)
{
	console.log('Broadcast stats');
	app.io.broadcast('stats:update', changes);
}

module.exports = function(app, delay)
{
  mongo.get().then(function(db) {

    setTimeout(function pollStats() {
      db.collection('log_totals').find({}, {sort: '_id'}, function(err, res) {
        if (err) throw err;

        res.toArray(function(err, totals) {
          if (err) throw err;

          var theTotals = StatCache.get();
          StatCache.set(totals);

          // if nothing cached yet, broadcast all
          if (!theTotals) {
	          send(app, totals);
          } else {
            // otherwise broadcast deltas
            var changed = [];

            for (var i = 0, l = totals.length; i < l; ++i) {
            	if (theTotals[i].visits !== totals[i].visits ||
            	  theTotals[i].views !== totals[i].views ||
                theTotals[i].emails !== totals[i].emails ||
                theTotals[i].calls !== totals[i].calls ||
                theTotals[i].tweets !== totals[i].tweets ||
                theTotals[i].facebooks !== totals[i].facebooks) {
                changed.push(totals[i]);
              }
            }

            if (changed.length) {
          		send(app, changed);
            }
          }

          // poll for changes
          setTimeout(pollStats, delay);
        });
      });

    }, delay);
  });
};
