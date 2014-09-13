/**
 * Event broadcast layer, throttles updates
 *
 * Captures and batches client updates since we really don't need to saturate
 * the network by sending them continuously; there'll be no visible difference
 * between an event every 700ms that updates a counter by 7 and 7 events 100ms apart.
 *
 * @package  StopTheSpies API
 * @author   Sam Pospischil <pospi@spadgos.com>
 * @since    2014-09-12
 */

function EventBatcher(app, delay)
{
	this.app = app;
	this.delay = delay;

	this.eventPool = {};
	this.dataHandlers = {};

	this.waiting = null;
}

/**
 * Callback args: existing data (undefined on first run), new event data, event name
 *
 * Should return the new data to send with the batch event when done.
 * Default behaviour is just to push onto an array.
 */
EventBatcher.prototype.setEventHandler = function(eventName, handlerCallback)
{
	this.dataHandlers[eventName] = handlerCallback;
};

EventBatcher.prototype.fire = function(eventname, data)
{
	var self = this;

	if (this.dataHandlers[eventname]) {
		this.eventPool[eventname] = this.dataHandlers[eventname](this.eventPool[eventname], data, eventname);
	} else {
		this.eventPool[eventname] || (this.eventPool[eventname] = []);
		this.eventPool[eventname].push(data);
	}

	if (!this.waiting) {
		this.waiting = setTimeout(function runBatch() {
			self.broadcast();
			self.waiting = null;
		}, this.delay);
	}
};

EventBatcher.prototype.broadcast = function()
{
	if (!this.waiting) {
		return false;
	}

	var io = this.app.io;

	for (var eventname in this.eventPool) {
		io.broadcast(eventname, this.eventPool[eventname]);
	}

	this.eventPool = {};

	return true;
};

module.exports = EventBatcher;
