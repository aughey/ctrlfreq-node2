var filetraverse = require('./filetraverse');
var parallel_limiter = require('./parallel_limiter');
var logger = require("./logger");
var filechunker = require("./file_chunker");
var _ = require('underscore');
var Q = require('q');

var args = process.argv;
args.shift();
args.shift();

var dummyhandler = {
	opendir: function(dirname) {
		return Q(dummyhandler);
	},
	close: function() {
		return Q();
	},
	storefile: function(info) {
		//console.log("asked to store file " + info.fullpath);
		return Q.fcall(function() {

		})
	}
};

var dummystore = {
	save: function(b) {
		return Q();
	}
}

var handler = parallel_limiter.create(logger.create(filechunker.create(dummystore)));

var pending = _.map(args, function(dir) {
  return filetraverse.traverse(dir,handler);
});
Q.all(pending).then(function() {
	console.log("DONE");
}).done();

