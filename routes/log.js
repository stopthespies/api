/**
 * Querystring parameters:
 *
 * event - The type of event to log (views, calls or emails). Other parameters differ by event type:
 *
 * 'visits'
 * 	- passed parameterless. logs a pageview.
 *
 * 'views'
 * 	- must come with a 'legislators' parameter, may contain an arbitrary number of IDs
 *
 * 'calls'
 * 	- must come with a 'legislators' parameter containing only a single ID
 *
 * 'emails'
 * 	- must come with a 'legislators' parameter containing only a single ID
 *
 * 'tweets'
 * 	- must come with a 'legislators' parameter containing only a single ID
 *
 * 'facebooks'
 * 	- must come with a 'legislators' parameter containing only a single ID
 */

var async = require('async');

var mongo = require(__dirname + '/../lib/database');
var config = require(__dirname + '/../_config_');

var EVENT_TYPES = ['visits', 'views', 'calls', 'emails', 'tweets', 'facebooks'];
var COLLECTION_NAME = 'log_totals';
var OVERALL_TOTALS_ID = 'overall_totals';

var TIMES_COLLECTION_NAME = 'log_event_times';

module.exports = function() {

    function sendToMongo(query, event_type, db, eventsToLog) {

        var inc_update = {$inc: {} };
        inc_update['$inc'][event_type] = 1;

        db.collection(COLLECTION_NAME).update(
            query,
            inc_update,
            { multi : true },
            function(err, result) {
                if (err) {
                    console.warn("Mongo aggregate write failed:", query, inc_update);
                    return;
                }

                console.log("Added event to MongoDB");
            }
        );

        if (eventsToLog.length) {
	        db.collection(TIMES_COLLECTION_NAME).insert(eventsToLog, function(err, res) {
	            if (err) {
	                console.warn("Mongo log write failed:", eventsToLog);
	                return;
	            }
	        });
	    }
	}

    function success(req) {
        req.io.respond({
            message: 'Event logged'
        });
    }

    function fail(req) {
        req.io.respond({
            error: 'Failed to log'
        });
    }

    function invalidRequest(req) {
        req.io.respond({
            error: 'Invalid request'
        });
    }

    function main(req, eventBroadcaster) {
        var event_type = this.input(req, 'event');
        var legislators = this.input(req, 'legislators');
        var repeated = this.input(req, 'repeat');
        var eventTime = new Date();
        var query;

        if (legislators && !Array.isArray(legislators)) {
        	legislators = [legislators];
        }

        if (EVENT_TYPES.indexOf(event_type) == -1) {
        	console.warn("HACK ATTEMPT:", req.data || req.query);	// let Forever catch these
	        invalidRequest(req);
        	return;
        }

        var eventsToLog = [];
        if (legislators) {
			legislators.forEach(function(leg) {
				eventsToLog.push({
					legislator : leg,
		        	type : event_type,
		        	time : eventTime,
		        	isRepeat : repeated,
		        });
			});
		} else {
			eventsToLog = [{
	        	type : event_type,
	        	time : eventTime,
	        	isRepeat : repeated,
			}];
		}

        try {
	        switch (event_type) {
	        	case 'visits':
	        		query = { _id : OVERALL_TOTALS_ID };
	        		break;
	        	case 'views':
		        	if (legislators) {
		        		query = { _id : { $in : legislators } };
		        	} else {
		        		query = { _id : OVERALL_TOTALS_ID };
		        	}
	       			break;
	        	default:
		        	// increment global totals for non-visit event types as well
                	legislators.push(OVERALL_TOTALS_ID);
	        		query = { _id : { $in : legislators } };
	       			break;
	        }
		} catch (e) {
			// validation error.
        	console.warn("HACK ATTEMPT:", req.data || req.query);	// let Forever catch these
	        invalidRequest(req);
	        return;
		}

        console.log("LOG A "+event_type+" EVENT", query);

        // send application events for legislators only as we don't need to keep visible totals
        // for them onscreen - their stats are only shown to a user after being loaded at that
        // point in time. Global stats sent by broadcast/logs.js
        if (legislators) {
			eventBroadcaster.fire('l:' + event_type, legislators);
        }

        mongo.get().then(
            function onSuccess(db) {
                sendToMongo(query, event_type, db, eventsToLog);
                success(req);	// do not wait for write acknowledgement
            },
            function onErr(err) {
                fail(req);
            }
        );
    };

    return main;

}();
