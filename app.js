var filetraverse = require('./filetraverse');
var parallel_limiter = require('./parallel_limiter');
var logger = require("./logger");
var _ = require('underscore');
var Q = require('q');

var args = process.argv;
args.shift();
args.shift();

var dummyhandler = {
	opendir: function(dirname) {
		return Q.fcall(function() {
			return dummyhandler;
		});
	},
	close: function() {
		return Q.fcall(function() {

		});
	},
	storefile: function(info) {
		//console.log("asked to store file " + info.fullpath);
		return Q.fcall(function() {

		})
	}
};

var handler = parallel_limiter.create(logger.create(dummyhandler));

var pending = _.map(args, function(dir) {
  return filetraverse.traverse(dir,handler);
});
Q.all(pending).then(function() {
	console.log("DONE");
}).done();

