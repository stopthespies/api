module.exports = function() {

    var MongoClient = require('mongodb').MongoClient;

    var EVENT_TYPES = ['view', 'call', 'email'];
    var COLLECTION_NAME = 'log_totals';
    var OVERALL_TOTALS_ID = 'overall_totals';

    function connectToMongo(onSuccess) {
        MongoClient.connect(
            process.env.MONGOHQ_URL,
            function onConnect(err, db) {
                if (err) {
                    throw err;
                }
                console.log("Connected to MongoDB...");

                process.nextTick(
                    function() {
                        onSuccess(db);
                    }
                );
            }
        );

    }

    function sendToMongo(event_type, db) {

        query = {_id: OVERALL_TOTALS_ID};

        inc_update = {$inc: {} };
        inc_update['$inc'][event_type] = 1;

        db.collection(COLLECTION_NAME).update(
            query,
            inc_update,
            function(err, result) {
                if (err) {
                    throw err;
                }

                console.log("Added event to MongoDB");
            }
        );
    }

    function success(res) {
        res.send({
            message: 'Event logged'
        });
    }

    function fail(res) {
        res.send({
            message: 'Failed to log'
        });
    }

    function main(req, res) {

        var event_type = req.query.event;

        if (EVENT_TYPES.indexOf(event_type) > -1) {
            console.log("LOG A "+event_type+" EVENT");

            connectToMongo(
                    function(db) {
                        sendToMongo(event_type, db);
                        success(res);
                    }
            );
            return;
        }

        fail(res);
        return;

    };

    return main;

}();
