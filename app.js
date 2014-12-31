var filetraverse = require('./filetraverse');
var parallel_limiter = require('./parallel_limiter');
var logger = require("./logger");
var filechunker = require("./file_chunker");
var leveldb_store = require("./leveldb_store");
var processfile_cache = require("./processfile_cache");
var file_excludes = require("./file_excludes");
var indexer = require("./indexer");
var _ = require('underscore');
var Q = require('q');

var args = process.argv;
args.shift();
args.shift();

leveldb_store.create("db").then(function(store) {

	var chain = [
		file_excludes, parallel_limiter, processfile_cache, logger,
		//indexer,
		filechunker
	];
	chain.reverse();
	var handler = store;
	_.each(chain, function(c) {
		handler = c.create(handler);
	})

	var pending = _.map(args, function(dir) {
		console.log("Backing up: " + dir);
		return filetraverse.traverse(dir, handler);
	});
	Q.all(pending).then(function() {
		console.log("Destroying handler")
		return handler.destroy();
	}).then(function() {
		console.log("DONE");
	}).done();
}).done();