var filetraverse = require('./filetraverse');
var parallel_limiter = require('./parallel_limiter');
var logger = require("./logger");
var filechunker = require("./file_chunker");
var leveldb_store = require("./leveldb_store");
var processfile_cache = require("./processfile_cache");
var file_excludes = require("./file_excludes");
var _ = require('underscore');
var Q = require('q');

var args = process.argv;
args.shift();
args.shift();

leveldb_store.create("db").then(function(store) {
	var handler = file_excludes.create(
		parallel_limiter.create(
			processfile_cache.init('cache.json',
				logger.create(
					filechunker.create(store))
			)
		)
	);

	var pending = _.map(args, function(dir) {
		return filetraverse.traverse(dir, handler);
	});
	Q.all(pending).then(function() {
		console.log("Destroying handler")
		return handler.destroy();
	}).then(function() {
		console.log("DONE");
	}).done();
});