var Q = require('q');

function limit(count, dm) {
	var waiting = [];

	function runnext() {
		if (waiting.length === 0) {
			return;
		}
		var deferred = waiting.shift();
		
		deferred.resolve(function(data) {
			//console.log("Rate limit done: " + dm + " " + waiting.length)
			if (waiting.length !== 0) {
				process.nextTick(runnext);
			} else {
				count++;
			}
		});
	}

	return function(debugmessage) {
		var deferred = Q.defer();

		waiting.push(deferred);
		if (count > 0) {
			count--;
			process.nextTick(runnext);
		} else {
			//console.log("Rate limiting: " + dm + ":" + debugmessage + " " + waiting.length)
		}
		return deferred.promise;
	};
}

module.exports = {
	limit: limit
};