/**
 * Legislator event broadcast layer throttle (to save bandwidth)
 *
 * This doesn't work via polling mongo as with aggregate states, since accuracy is less
 * of a concern here (you'll always be resynced when you reload the page).
 *
 * @package  StopTheSpies API
 * @author   Sam Pospischil <pospi@spadgos.com>
 * @since    2014-09-12
 */

var EventBatcher = require(__dirname + '/../../lib/event-throttle');

module.exports = function(app, delay) {
	var legislatorEventBroadcaster = new EventBatcher(app, delay);

	function pushLegislatorEvent(existing, newData, eventName)
	{
		existing || (existing = {});
		newData.forEach(function(memberId) {
			existing[memberId] || (existing[memberId] = 0);
			++existing[memberId];
		});
		return existing;
	}

	['views', 'calls', 'emails', 'tweets', 'facebooks'].forEach(function(evt) {
		legislatorEventBroadcaster.setEventHandler(evt, pushLegislatorEvent);
	});

	return legislatorEventBroadcaster;
};
