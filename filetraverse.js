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

	function processdir(dirname, handler, handle) {
		dirname = dirname.replace(/\/+$/,'');
		var dirobj = {
			path: dirname,
			handle: handle
		};
		return handler.opendir(dirobj).then(function(handle) {

			var directory_data = {
				path: dirname,
				files: [],
				dirs: [],
			};

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
						storestat.mtime = storestat.mtime / 1000;
						var info = {
							fullpath: fullpath,
							file: file,
							stat: storestat,
							handle: handle
						};
						if (stat.isFile()) {
							return handler.storefile(info).then(function(res) {
								if(res) {
									res.n = file;
									directory_data.files.push(res);
								}
								return res;
							});
						} else if (stat.isDirectory()) {
							return processdir(fullpath,handler,handle).then(function(res) {
								if(res) {
									res.n = file;
									directory_data.dirs.push(res);
								}
								return res;
							})
						} else {
							console.log("Unknown file: " + fullpath);
						}
					}

					return Q.nfcall(fs.stat, fullpath).then(handleStat).catch(function(error) {
						console.log("Stat error: " + error);
						console.log(typeof error);
						console.log(error);
						throw error;
						handleStat(null);
					});
				});

				if(stats.length == 0) {
					handler.dirdone(handle);
				}

				return Q.all(stats).then(function() {
					directory_data.files = directory_data.files.sort();
					directory_data.dirs = directory_data.dirs.sort();
				}).then(function() {
					return handler.close(handle);
				}).then(function() {
					return handler.storedirectory(directory_data);
				}).then(function(res) {
					return res;
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