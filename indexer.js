//var si = require('search-index');
var Q = require('q');
var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var c = require("./chain");
var spawn = require('child_process').spawn;

function create(chain, database) {
	var filters = ['fullpath'];
	var batch = [];

	var didstat = null;
	var index_count = 0;

	function catdocExists() {
		if (didstat === null) {
			didstat = fs.existsSync("/usr/bin/catdoc");
		}
		return didstat;
	}

	function getContent(fullpath) {
		var deferred = Q.defer();

		var file = fullpath.toLowerCase();
		var ext = path.extname(file);
		var extensions = ['.md', '.c', '.h', '.js', '.doc'];
		if (_.contains(extensions, ext) || _.contains(["README"], file)) {
			if (catdocExists() && ext === '.doc') {
				var child = spawn('/usr/bin/catdoc', [fullpath]);
				var content = "";
				child.stdout.on('data', function(data) {
					content = content + data.toString();
				});
				child.stderr.on('data', function(data) {
					console.log("ERR: " + data);
				});
				child.on('close', function() {
					console.log("CLOSE");

					deferred.resolve(content);
				})
			} else if (ext !== '.doc') {
				deferred.resolve(fs.readFileSync(file).toString());
			}
		} else {
			deferred.resolve(null);
		}

		return deferred.promise;
	}

	function processBatch() {
		if (batch.length == 0) {
			return Q();
		}

		var b = batch;
		batch = [];

		return database.save_batch(b);
	}

	return c.extend(chain,{
		opendir: function(dir) {
			var hishandle = null;
			var oldhandle = dir.handle;
			if (dir.handle) {
				hishandle = dir.hishandle;
				dir.handle.dirs.push(dir.path);
			}
			dir.handle = hishandle;
			return chain.opendir(dir).then(function(hishandle) {
				dir.handle = oldhandle;
				return {
					path: dir.path,
					dirs: [],
					files: [],
					hishandle: hishandle
				}
			})
		},
		storefile: function(info) {
			info.handle.files.push(info.file);
			return chain.storefile(info).then(function(res) {
				return getContent(info.fullpath).then(function(content) {
					var document = _.pick(info, ['fullpath', 'stat']);
					document.key = res;

					if (content) {
						document.content = content.slice();
					}
					batch.push(document);
					index_count += 1;
					if (batch.length >= 10) {
						return processBatch().then(function() {
							return res;
						})
					} else {
						return res;
					}
				});
			});
		},
		stats: function(s) {
			s.files_indexed = index_count;
			return chain.stats(s);
		},
		storedirectory: function(info) {
			return chain.storedirectory(info);
		},

		dirdone: function(handle) {
			return chain.dirdone(handle.hishandle);
		},
		close: function(handle) {
			return chain.close(handle.hishandle);
		},
		destroy: function() {
			return chain.destroy().then(processBatch).then(function() {
				return database.destroy();
			});
		}
	});
}

module.exports = {
	create: create
}