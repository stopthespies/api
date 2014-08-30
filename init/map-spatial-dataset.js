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
 * @package StopTheSpies API
 * @author  Sam Pospischil <pospi@spadgos.com>
 * @since   2014-08-18
 */

var geoJSON = require(__dirname + '/../../website/map/electorates.json');
var destFile = __dirname + '/member_electorates.json';

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

var members = require('au-legislator-contacts-csv');

//------------------------------------------------------------------------------

var fs = require('fs');

var countFails = 0, countSuccesses = 0, countDupes = 0,
	membersCount = 0, senatorsCount = 0, repsCount = 0;

var outputFeatures = [];

members.get().then(function(reps) {
	process.nextTick(function() {
		reps.forEach(matchGeoJSON);
		outputResult();
	});
}, function(err) {
	console.error('Problem loading legislators CSV data');
	throw err;
});

// match records against reference place names

function matchGeoJSON(member)	// ლ(ಠ益ಠლ)
{
	++membersCount;

	if (!member.electorate) {
		console.log('empty record, ignoring');
		return;
	}

	if (member.house === 'senate') {
		++senatorsCount;
		console.log('Ignore senator: ' + member.full_name);
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
		console.error('Member ' + member.full_name + ' [' + member.openaus_id + '] has unknown state: ' + member.electorate);
		return;
	}

	var dupeCheck = false;

	geoJSON.features.forEach(function(feat) {
		if (memberState == feat.properties.STATE) {
			if (feat.properties.ELECT_DIV.match(new RegExp('^' + ward + '$', 'i'))) {
				if (dupeCheck) {
					console.error('Member ' + member.full_name + ' [' + member.openaus_id + '] matches multiple areas: ' + member.electorate);
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
			electorate : feat.properties.ELECT_DIV,
			member_id : member.openaus_id,
			state : feat.properties.STATE,
			area_sqkm : feat.properties.AREA_SQKM
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
