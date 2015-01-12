var Q = require('q');
var MongoClient = require('mongodb').MongoClient
var mongopaths = require("./mongo-paths");

var url = mongopaths.url();

function create() {
	return Q.ninvoke(MongoClient, 'connect', url).then(function(db) {
		console.log("Connected to " + url);

		var collection = db.collection('files');


		function save_batch(batch) {
			return Q.ninvoke(collection, 'insert', batch);
		}

		var indices = [
			Q.ninvoke(collection, 'ensureIndex', {
				content: 'text',
				fullpath: 'text',
				'stat.mtime': 1
			}),
		];
		return Q.all(indices).then(function() {
			return {
				save_batch: save_batch,
				destroy: function() {
					console.log("Closing Mongodb index")
					db.close();
				}
			}

		})

	})
}

module.exports = {
	create: create
}
