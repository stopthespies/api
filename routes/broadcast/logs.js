/**
 * Log event broadcaster.
 *
 * This layer allows us to broadcast periodical updates to the counter stats
 * independently of writes (which use increment operations).
 *
 * caveats:
 *   - Initial total and latest time query could be slightly off if restarted under
 *     heavy load. This will result in a very minor offset to the stats but won't
 *     lead to anything escalating.
 *
 * @package  StopTheSpies API
 * @author   Sam Pospischil <pospi@spadgos.com>
 * @since    2014-08-30
 */

var async = require('async');
var mongo = require(__dirname + '/../../lib/database');
var config = require(__dirname + '/../../_config_');

module.exports = function()
{
  var app = this;

  var theTotals = null;

  mongo.get().then(function(db) {
    setInterval(function() {
      db.collection('log_totals').find({_id : 'overall_totals'}, function(err, res) {
        if (err) throw err;
        res.toArray(function(err, totals) {
          if (err) throw err;

          if (!theTotals ||
              theTotals.views !== totals.views ||
              theTotals.emails !== totals.emails ||
              theTotals.calls !== totals.calls) {
            app.io.broadcast('get_stats', totals);
          }

          theTotals = totals;
        });
      });
    }, config.broadcast_logs_interval);
  });
};
