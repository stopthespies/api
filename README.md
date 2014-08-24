StopTheSpies api
===

Responsible for various functions of the campaign:

- Event logging (tracking of pageview, share, email etc stats)
- Email sends (legislator contact engine)
- Statistics reading (for display of logged event totals on the site)
- Tweets reading (for supporter list at base of site)



## Implementation

#### Server

The webserver component is a simple [express.io](https://www.npmjs.org/package/express.io) implementation. The main `web.js` spawns a server instance and listens on various endpoints handled by the other scripts. Each route handler callback has access to the main express app object via `this`.

The socket server broadcasts events to all clients when the `/log` endpoint is hit. These events all receive an array of legislator IDs which indicate the relevant legislators for the event. Where an empty legislators array is passed the event is a global one (for example, website pageview has no affiliation to any particular legislator). Any of the following events can be sent: `views`, `calls`, `emails`, `tweets` or `facebooks`.

#### Backend Jobs

Files in the `workers` directory are spawned as [forever](https://www.npmjs.org/package/forever) daemons and run continually to draw in necessary data.

- `tweets.js` polls a hash tag and pulls in matching tweets to our mongodb replicaset for querying




## Notes

- Errors are only thrown on mongo connection failures; this causes Forever to reboot the server and is effectively an auto-reconnect. For non-critical problems, we call `console.warn()` so that Forever can pick that up and email it to an alert box as with the errors. Shouldn't lose any statistics data even with a DB failure as we can increment by counting error log lines.
