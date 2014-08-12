module.exports = function(req, res) {
	var tweets = [{
		tweet: 'I think we should eat book cases #stopthespies What do you think?',
		handle: 'neutralthoughts',
		avatar: 'https://pbs.twimg.com/profile_images/488579015507050497/QvG1ArTx_400x400.jpeg',
		link: 'https://twitter.com/neutralthoughts/status/499062476063776768',
		category: 'politician',
		followers: 1000
	}];
    res.jsonp(tweets);
};
