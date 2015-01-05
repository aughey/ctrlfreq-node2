var hash = require('./hash');
var MongoClient = require('mongodb').MongoClient
var Q = require('q');

var url = 'mongodb://localhost:27017/ctrlfreq-node2';

function create() {
	return Q.ninvoke(MongoClient, 'connect', url).then(function(db) {
		console.log("MongoDB_Store Connected to " + url);

		var collection = db.collection('chunks');
		var dircollection = db.collection('dirs');

		function isChunkStored(key, c) {
			if (!c) {
				c = collection;
			}
			var cursor = c.find({
				hash: key
			});
			//console.log("finding dir hash: " + key)
			cursor.limit(1)
			return Q.ninvoke(cursor, 'count').then(function(count) {
				//console.log("Key: " + key + " returned " + count);
				if (count > 0) {
					return true;
				} else {
					return false;
				}
			});
		}


		function save_dir(dir) {
			var data = JSON.stringify(dir);
			var digest = hash.hash(data);
			dir.hash = digest;
			//console.log("savedir " + JSON.stringify(dir))

			var ret = {
				hash: digest
			}
			return isChunkStored(digest, dircollection).then(function(isstored) {
				if (isstored) {
					return ret;
				} else {
					return Q.ninvoke(dircollection, 'insert', dir).then(function() {
						return ret;
					}).fail(function(err) {
						if (err.code === 11000) {
							// This is ok, it's a duplicate insert
							console.log("    * * * Got a duplicate dir insert for " + dir.path + "  Watch this");
							console.log(dir);
							console.log(err);
							return ret;
						} {
							console.log("Error insertting");
							console.log(err);
							throw (err);
						}
					});
				}
			});
		}


		function save_chunk(buffer, precomputedkey, debug) {
			var digest = null;
			if (precomputedkey) {
				digest = precomputedkey;
			} else {
				digest = hash.hash(buffer);
			}

			return isChunkStored(digest).then(function(isstored) {
				if (isstored) {
					return digest;
				} else {
					var data = {
						hash: digest,
						data: buffer
					};
					return Q.ninvoke(collection, 'insert', data).then(function() {
						console.log("Insertted chunk " + digest);
						return digest;
					}).fail(function(err) {
						if (err.code === 11000) {
							// This is ok, it's a duplicate insert
							console.log("Got a duplicate chunk insert for " + digest + "  Watch this");
							return digest;
						} {
							console.log("Error insertting");
							console.log(err);
							throw (err);
						}
					});
				}
			})
		}

		console.log("Returning opened store");
		return Q.ninvoke(collection, 'ensureIndex', {
			hash: 1
		}, {
			unique: true
		}).then(function() {
			return Q.ninvoke(dircollection, 'ensureIndex', {
				hash: 1,
			}, {
				unique: true
			})
		}).then(function() {
			return Q.ninvoke(dircollection, 'ensureIndex', {
				path: 1,
			})
		}).then(function() {
			return {
				save_chunk: save_chunk,
				save_dir: save_dir,
				destroy: function() {
					return Q.ninvoke(db, 'close');
				}
			}
		});
	});
}

module.exports = {
	create: create
}