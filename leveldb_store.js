var levelup = require('level');
var hash = require('./hash');

var Q = require('q');

var db = null; // connected before we process directories.

function noop() {}

function createstore(db) {
	var chunkcount = 0;
	var chunkwrite = 0;
	var bytewrite = 0;
	var bytecount = 0;

	function isChunkStored(key, cb) {
		var iterator = db.db.iterator({
			start: key,
			values: false
		});
		iterator.next(function(err, ikey) {
			iterator.end(noop);
			if (!ikey) {
				cb(false);
			}
			if (ikey == key) {
				cb(true);
			} else {
				cb(false);
			}
		})
	}

	function save(buffer, precomputedkey, debug) {
		var deferred = Q.defer();

		if (precomputedkey) {
			var digest = precomputedkey;
		} else {
			var digest = hash.hash(buffer);
		}

		chunkcount++;
		bytecount += buffer.length;


		//deferred.resolve(digest);
		//return deferred.promise;

		isChunkStored(digest, function(stored) {
			if (stored) {
				deferred.resolve(digest);
				//console.log("Key: " + digest + " already in database")
			} else {
				//console.log("##STORING key " + digest + " " + debug);
				//console.log(buffer);
				db.put(digest, buffer, function(err) {
					//console.log(" ## done storing key " + digest)
					if (err) {
						console.log("Error writing sha to database: " + err);
						process.exit(1);
						deferred.resolve(null);
						return;
					}
					chunkwrite++;
					bytewrite += buffer.length;
					deferred.resolve(digest);
				});
			}
		});

		return deferred.promise;
	}

	console.log("Returning opened store");
	return {
		save: save,
		destroy: function() {
			return Q.ninvoke(db, 'close');
		}
	}
}

module.exports = {
	create: function(dbpath) {
		console.log("Creating store at " + dbpath);
		return Q.nfcall(levelup, dbpath).then(createstore);
	}
}