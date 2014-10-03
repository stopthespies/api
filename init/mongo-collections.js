var mongo = require(__dirname + '/../lib/database');
var config = require(__dirname + '/../_config_');
var members = require('au-legislator-contacts-csv');

members.get().then(function(members) { initDatabase(members); }, function(err) { throw err; });

function initDatabase(members)
{
	mongo.get().then(function(db) { initCollections(db, members); }, function(err) { throw err; });
}

function initCollections(db, members)
{
    var i,
        collectionsAndIndexes = config.mongoSetup.collectionsAndIndexes,
        collectionRecords = config.mongoSetup.collectionRecords,
        running = 0;


	// reduce members to openaus IDs
	members = members.map(function(m) {
		return (m.openaus_id && m.openaus_id !== 'null') ? {
			_id : m.openaus_id,
		} : false;
	}).filter(function(m) {
		return m !== false;
	});
	collectionRecords[config.mongoSetup.totalsTable] = collectionRecords[config.mongoSetup.totalsTable].concat(members);

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
