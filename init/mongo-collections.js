var MongoClient = require('mongodb').MongoClient;

MongoClient.connect(process.env.MONGOHQ_URL, function(err, db) {
	if (err) throw err;

    process.nextTick(function() { initCollections(db); });
});

function initCollections(db)
{
    var i,
        collectionsAndIndexes = {
            log_totals : [],
            log_legislators : [
	            { calls : 1 },
	            { emails : 1 },
	            { views : 1 },
            ],
			tweets : [

            ],
        },
        running = 0;

    console.log("Connected to mongo, initing collections...");

    function whenDone()
    {
        if (--running == 0) {
        	console.log('READY FOR JUSTICE, BYES');
        	process.exit();
        }
    }

    for (i in collectionsAndIndexes) {
    	++running;
        (function() {
            var coll = i,
                fields = collectionsAndIndexes[i];
            db.createCollection(coll, function(err, collection) {
                console.log('Created collection ' + coll);

                var j;
                for (j in fields) {
                	++running;
                    (function() {
                        var index = fields[j];
                        collection.ensureIndex(index, function(err, indexName) {
                            console.log('Indexed collection ' + coll + ':', index);
                            whenDone();
                        });
                    })();
                }

            	whenDone();
            });
        })();
    }
}
