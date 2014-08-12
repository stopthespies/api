var mongo = require(__dirname + '/../lib/database');

mongo.get().then(function(db) { initCollections(db); }, function(err) { throw err; });

function initCollections(db)
{
    var i,
        collectionsAndIndexes = {				// CONFIGURE COLLECTIONS TO PREPOPULATE
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
        collectionRecords = {					// CONFIGURE RECORDS TO PREPOPULATE
        	log_totals : [
        		{ _id : 'overall_totals' }
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
                fields = collectionsAndIndexes[i],
                records = collectionRecords[i] || null;

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

                var k;
                for (k in records) {
                	++running;
                    (function() {
                        collection.save(records[k], function(err, res) {
                            console.log('Stored record for ' + coll);
                            whenDone();
                        });
                    })();
                }

            	whenDone();
            });
        })();
    }
}
