api
===

Responsible for various functions for the campaign


## Notes

- Errors are only thrown on mongo connection failures; this causes Forever to reboot the server and is effectively an auto-reconnect. For non-critical problems, we call `console.warn()` so that Forever can pick that up and email it to an alert box as with the errors.
