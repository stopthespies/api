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

module.exports = function(app, delay)
{
  var theTotals = null;

  mongo.get().then(function(db) {
    setTimeout(function pollStats() {
      db.collection('log_totals').find({_id : 'overall_totals'}, function(err, res) {
        if (err) throw err;
        res.toArray(function(err, totals) {
          if (err) throw err;

          totals = totals[0];

          if (!theTotals ||
              theTotals.views !== totals.views ||
              theTotals.emails !== totals.emails ||
              theTotals.calls !== totals.calls) {
            console.log('Broadcast stats');
            app.io.broadcast('stats:update', [totals]);
          }

          theTotals = totals;

          setTimeout(pollStats, delay);
        });
      });
    }, delay);
  });
};
