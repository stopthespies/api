/**
 * Querystring parameters:
 *
 * event - The type of event to log (views, calls or emails). Other parameters differ by event type:
 *
 * 'views'
 * 	- can be passed parameterless to register a pageview
 *  - can come with a 'legislators' comma-separated string of legislator IDs
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

var mongo = require(__dirname + '/lib/database');
var config = require(__dirname + '/_config_');

var EVENT_TYPES = ['views', 'calls', 'emails', 'tweets', 'facebooks'];
var COLLECTION_NAME = 'log_totals';
var OVERALL_TOTALS_ID = 'overall_totals';

module.exports = function() {

    function sendToMongo(query, event_type, db) {

        var inc_update = {$inc: {} };
        inc_update['$inc'][event_type] = 1;

        db.collection(COLLECTION_NAME).update(
            query,
            inc_update,
            function(err, result) {
                if (err) {
                    console.warn("Mongo write failed:", query, inc_update);
                    return;
                }

                console.log("Added event to MongoDB");
            }
        );
    }

    function success(res) {
        res.jsonp({
            message: 'Event logged'
        });
    }

    function fail(res) {
        res.jsonp({
            error: 'Failed to log'
        });
    }

    function invalidRequest(res) {
        res.jsonp({
            error: 'Invalid request'
        });
    }

    function main(req, res) {

        var event_type = req.query.event;
        var legislators = req.query.legislators || null;
        var query;

        if (EVENT_TYPES.indexOf(event_type) == -1) {
        	console.warn("HACK ATTEMPT:", req);	// let Forever catch these
	        invalidRequest(res);
        	return;
        }

        try {
	        switch (event_type) {
	        	case 'views':
		        	if (legislators) {
		        		query = { _id : { $in : legislators.split(',') } };
		        	} else {
		        		query = { _id : OVERALL_TOTALS_ID };
		        	}
	       			break;
	        	default:
	        		query = { _id : legislators };
	       			break;
	        }
		} catch (e) {
			// validation error.
        	console.warn("HACK ATTEMPT:", req);	// let Forever catch these
	        invalidRequest(res);
	        return;
		}

        console.log("LOG A "+event_type+" EVENT", query);

        // send application event
        this.io.broadcast(event_type, legislators || []);

        mongo.get().then(
            function onSuccess(db) {
                sendToMongo(query, event_type, db);
                success(res);	// do not wait for write acknowledgement
            },
            function onErr(err) {
                fail(res);
            }
        );
    };

    return main;

}();
