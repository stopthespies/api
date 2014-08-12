var mongo = require(__dirname + '/../lib/database');

mongo.get().then(function(db) { initCollections(db); }, function(err) { throw err; });

function initCollections(db)
{
    var i,
        collectionsAndIndexes = {
        	worker_state : [],
            log_totals : [
	            { calls : 1 },
	            { emails : 1 },
	            { views : 1 },
            ],
			tweets : [
				{ followers_count : 1 },
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
