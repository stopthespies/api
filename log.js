module.exports = function() {

    var MongoClient = require('mongodb').MongoClient;

    var EVENT_TYPES = ['view', 'call', 'email'];

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
        var new_doc = {"event_type": event_type};

        db.collection("log_totals").insert(
                new_doc,
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
