var filetraverse = require('./filetraverse');
var parallel_limiter = require('./parallel_limiter');
var logger = require("./logger");
var filechunker = require("./file_chunker");
var leveldb_store = require("./leveldb_store");
var processfile_cache = require("./processfile_cache");
var file_excludes = require("./file_excludes");
var indexer = require("./indexer");
var mongodb_index = require("./mongodb_index");
var mongodb_store = require("./mongodb_store");
var _ = require('underscore');
var Q = require('q');

var args = process.argv;
args.shift();
args.shift();

mongodb_store.create().then(function(store) {
	return mongodb_index.create().then(function(mongo_index) {
		var chain = [
			file_excludes, parallel_limiter, processfile_cache, logger,
			[indexer,mongo_index],
			filechunker
		];
		chain.reverse();
		var handler = store;
		_.each(chain, function(c) {
			if(_.isArray(c)) {
				handler = c[0].create(handler,c[1]);
			} else {
				handler = c.create(handler);
			}
		})

		var pending = _.map(args, function(dir) {
			console.log("Backing up: " + dir);
			return filetraverse.traverse(dir, handler);
		});
		return Q.all(pending).then(function() {
			console.log("Destroying handler")
			return handler.destroy();
		}).then(function() {
			console.log("DONE");
			var stats = {};
			handler.stats(stats);
			console.log(stats);
		})
	})
}).done();