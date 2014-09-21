/**
 * Querystring parameters:
 *
 * event - The type of event to log (views, calls or emails). Other parameters differ by event type:
 *
 * 'views'
 * 	- can be passed parameterless to register a pageview
 *  - can come with a 'legislators' array of legislator IDs
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

var EVENT_TYPES = ['views', 'calls', 'emails', 'tweets', 'facebooks'];
var COLLECTION_NAME = 'log_totals';
var OVERALL_TOTALS_ID = 'overall_totals';

var TIMES_COLLECTION_NAME = 'log_event_times';

module.exports = function() {

    function sendToMongo(query, event_type, db) {

        var inc_update = {$inc: {} };
        inc_update['$inc'][event_type] = 1;

        var eventLog = {
        	type : event_type,
        	time : new Date()
        };

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

        // :TODO: these logs need to be differentiatable per legislator they target
        db.collection(TIMES_COLLECTION_NAME).insert(eventLog, function(err, res) {
            if (err) {
                console.warn("Mongo log write failed:", eventLog);
                return;
            }
        });
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
        var query;

        if (legislators && !Array.isArray(legislators)) {
        	legislators = [legislators];
        }

        if (EVENT_TYPES.indexOf(event_type) == -1) {
        	console.warn("HACK ATTEMPT:", req.data);	// let Forever catch these
	        invalidRequest(req);
        	return;
        }

        try {
	        switch (event_type) {
	        	case 'views':
		        	if (legislators) {
		        		query = { _id : { $in : legislators } };
		        	} else {
		        		query = { _id : OVERALL_TOTALS_ID };
		        	}
	       			break;
                case 'emails':
                    if (legislators) {
                        query = { _id : { $in : legislators } };
                    } else {
                        query = { _id : OVERALL_TOTALS_ID };
                    }
                    break;
                case 'calls':
                    if (legislators) {
                        query = { _id : { $in : legislators } };
                    } else {
                        query = { _id : OVERALL_TOTALS_ID };
                    }
                    break;
	        	default:
	        		query = { _id : { $in : legislators } };
	       			break;
	        }
		} catch (e) {
			// validation error.
        	console.warn("HACK ATTEMPT:", req.data);	// let Forever catch these
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
                sendToMongo(query, event_type, db);
                success(req);	// do not wait for write acknowledgement
            },
            function onErr(err) {
                fail(req);
            }
        );
    };

    return main;

}();
