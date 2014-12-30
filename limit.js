var Q = require('q');

function limit(count, dm) {
	var waiting = [];

	function checkrun() {
		if (waiting.length !== 0) {
			var deferred = waiting.shift();
			deferred.resolve(checkrun);
		} else {
			count++;
		}
	}

	return function(debugmessage) {
		var deferred = Q.defer();
		if (count > 0) {
			count--;
			deferred.resolve(checkrun);
		} else {
			waiting.push(deferred);
		}

		return deferred.promise;
	};
}

module.exports = {
	limit: limit
};