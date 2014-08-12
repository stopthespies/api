module.exports = function(req, res) {
	var stats = {
		views: Math.ceil(Math.random()*5000),
		calls: Math.ceil(Math.random()*5000),
		emails: Math.ceil(Math.random()*5000)
	};
    res.jsonp(stats);
};
