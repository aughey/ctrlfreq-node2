var levelup = require('levelup');
var Q = require('q');

function noop() {}

module.exports = {
	create: function(path) {
		return Q.nfcall(levelup, path).then(function(db) {
			return {
				has: function(key) {
					return this.get(key).then(function(k) {
						return k !== null;
					}).catch(function() {
						return false;
					});					
				},
				put: function(key,value) {
					var deferred = Q.defer();
					db.put(key.toString(),value,function(err) {
						deferred.resolve(key);
					});
					return deferred.promise;
				},
				get: function(key) {
					return Q.ninvoke(db,'get',key);
				},
				close: function() {
					return Q.ninvoke(db, 'close');
				}
			};
		});
	}
};
