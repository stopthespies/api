/**
 * Map spatial electorate dataset to legislator records and generate combined geoJSON file
 *
 * This will probably only ever be done once, but to execute you will need to do the following:
 *
 * Edit the first path below to point to the raw electorate boundary dataset downloaded from
 * http://www.aec.gov.au/Electorates/gis/gis_datadownload.htm
 * Actually, I say raw, but you can and should pass this through mapshaper first, a GUI should be
 * online at http://mapshaper.org. This reduces filesize astronomically, I reduced quality
 * down to 0.5% whilst still maintaining fairly accurate boundary polygons.. this means the
 * divisions might be slightly misaligned in some cases; we circumvent this by querying intersection
 * against a bounding box and showing stats for all nearby electorates when in doubt - the end result
 * is faster computation of the results in the frontend and completely clientside geocoding.
 *
 * You could totally use the original file and import that dataset into mongo if you wanted to
 * put the servers behind it to run really exact queries, though. We would have to check that
 * there are no intersecting polygon arcs however as these do not pass index checks.
 *
 * Second path is a CSV of the data from the members / member IDs spreadsheet @rolandnsharp has.
 * You can edit column indexes and state name / ID mappings easily at the top if the format changes.
 * :TODO: link this data when final and publicly available somewhere
 *
 * @package StopTheSpies API
 * @author  Sam Pospischil <pospi@spadgos.com>
 * @since   2014-08-18
 */

var geoJSON = require(__dirname + '/../../website/map/COM20111216_ELB_region.json');
var csvFile = __dirname + '/reps.csv';
var destFile = __dirname + '/member_electorates.json';

var csvIdxs = {
	0 : 'type',
	2 : 'name',
	3 : 'electorate',
	13 : 'member_id',
};

var states = {
	'NT' : [ "northern territory" ],
	'QLD' : [ "queensland" ],
	'NSW' : [ "new south wales" ],
	'VIC' : [ "victoria" ],
	'TAS' : [ "tasmania" ],
	'SA' : [ "south australia" ],
	'WA' : [ "western australia" ],
	'ACT' : [ "australian capital territory" ],
};

//------------------------------------------------------------------------------

var fs = require('fs');
var csv = require('csv');

var countFails = 0, countSuccesses = 0, countDupes = 0,
	membersCount = 0, senatorsCount = 0, repsCount = 0;

// read CSV. Keep this simple it's a small file

var parser = csv.parse();
var csvStream = fs.createReadStream(csvFile), csvOpened = false;

var outputFeatures = [];

csvStream.on('data', function readCSV(data) {
	parser.write(data);
});
parser.on('readable', function parseCSV() {
	while (data = parser.read()) {
		matchGeoJSON(data);
	}
});
csvStream.on('end', outputResult);

// match records against reference place names

function matchGeoJSON(theHonorableMember)	// ლ(ಠ益ಠლ)
{
	var member = {}, i;

	for (i in csvIdxs) {
		member[csvIdxs[i]] = theHonorableMember[i] || null;
	}

	++membersCount;

	if (member.type == 'senate') {
		++senatorsCount;
		console.log('Ignore senator: ' + member.name);
		return;
	}
	++repsCount;

	function trim(str) {
		return str.trim();
	}

	var memberBits = member.electorate.split(',').map(trim);
	var ward;
	var state;
	var memberState;

	// if (memberBits.length == 1) {	// senators
	// 	state = memberBits[0].toLowerCase();
	// 	ward = null;
	// } else {							// representatives
		ward = memberBits[0];
		state = memberBits[1].toLowerCase();
	// }

	for (i in states) {
		if (states[i].indexOf(state) != -1) {
			memberState = i;
			break;
		}
	}

	if (!memberState) {
		++countFails;
		console.error('Member ' + member.name + ' [' + member.member_id + '] has unknown state: ' + member.electorate);
		return;
	}

	var dupeCheck = false;

	geoJSON.features.forEach(function(feat) {
		if (memberState == feat.properties.STATE) {
			if (feat.properties.ELECT_DIV.match(new RegExp('^' + ward + '$', 'i'))) {
				if (dupeCheck) {
					console.error('Member ' + member.name + ' [' + member.member_id + '] matches multiple areas: ' + member.electorate);
					++countDupes;
					--countSuccesses;
					return;
				}

				outputFeatures.push(mergeFeature(feat, member));
				++countSuccesses;
				dupeCheck = true;
			}
		}
	});
}

// write matched features to geoJSON output as we go

function mergeFeature(feat, member)
{
	return {
		type : feat.type,
		properties : {
			electorate : feat.ELECT_DIV,
			state : feat.STATE,
			member_id : member.member_id,
		},
		geometry : feat.geometry,
	};
}

function outputResult()
{
	fs.writeFileSync(destFile, JSON.stringify({
		type : 'FeatureCollection',
		features : outputFeatures,
	}));

	console.log('');
	console.log('Completed. Processed:');
	console.log(geoJSON.features.length, 'areas', '(', countSuccesses, 'ok ,', countFails, 'bad;', countDupes, 'dupes', ')');
	console.log(membersCount, 'members', '(', senatorsCount, 'senators ignored ,', repsCount, 'reps processed', ')');
}
