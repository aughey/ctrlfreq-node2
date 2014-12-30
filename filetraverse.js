var fs = require('fs');
var Q = require('q');
var _ = require('underscore');
var path = require('path');
var limit = require('./limit').limit;

function numberWithCommas(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

var filecount = 0;
var dircount = 0;
var chunkwrite = 0;

// Larger function to wrap  a single backup system.
function init() {
	var dirlimit = limit(10, "dirlimit");

	function processdir(dirname, handler) {
		return handler.opendir(dirname).then(function(handle) {
			return Q.nfcall(fs.readdir, dirname).then(function(dirfiles) {
				var pendingstats = dirfiles.length;
				var stats = _.map(dirfiles, function(file) {
					var fullpath = path.join(dirname, file);

					function handleStat(stat) {
						pendingstats--;
						if(pendingstats == 0) {
							handler.dirdone(handle);
						}
						if(!stat) {
							return;
						}
						var storestat = _.pick(stat, 'mode', 'uid', 'gid', 'size', 'mtime');
						storestat.mtime = storestat.mtime.toISOString();
						var info = {
							fullpath: fullpath,
							file: file,
							stat: storestat,
							handle: handle
						};
						if (stat.isFile()) {
							return handler.storefile(info);
						} else if (stat.isDirectory()) {
							return processdir(fullpath,handler);
						} else {
							console.log("Unknown file: " + fullpath);
						}
					}

					return Q.nfcall(fs.stat, fullpath).then(handleStat).catch(function(error) {
						console.log("Stat error: " + error);
						handleStat(null);
					});
				});

				if(stats.length == 0) {
					handler.dirdone(handle);
				}

				return Q.all(stats).then(function() {
					return handler.close(handle);
				});
			});
		});
	}

	return processdir;
}

module.exports = {
	traverse: function(dir, handler) {
		var processdir = init();
		return processdir(dir,handler);
	}
};