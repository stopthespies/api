module.exports = function() {

    var mongo = require(__dirname + '/lib/database');

    var EVENT_TYPES = ['views', 'calls', 'emails'];
    var COLLECTION_NAME = 'log_totals';
    var OVERALL_TOTALS_ID = 'overall_totals';

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

            mongo.get().then(
                function onSuccess(db) {
                    sendToMongo(event_type, db);
                    success(res);
                },
                function onErr(err) {
                    fail(res);
                    throw err;
                }
            );
            return;
        }

        fail(res);
        return;

    };

    return main;

}();
