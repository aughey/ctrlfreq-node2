var Q = require('q');
var limit = require('./limit').limit;

function create(chain) {
	var dirlimit = limit(5, "dirlimit");
	var filelimit = limit(10, "filelimit");

	function subcreate(dir) {
		return {
			opendir: function(dir) {
				var oldhandle = dir.handle;
				if (dir.handle) {
					dir.handle = dir.handle.hishandle;
				}
				return dirlimit(dir).then(function(thisdone) {
					var myhandle = {
						whendone: thisdone
					};
					return chain.opendir(dir).then(function(hishandle) {
						dir.handle = oldhandle;
						myhandle.hishandle = hishandle;
						return myhandle;
					});
				});
			},
			dirdone: function(handle) {
				handle.whendone();
				delete handle.whendone;
				chain.dirdone(handle.hishandle);
			},
			storefile: function(f) {
				return filelimit(f.fullpath).then(function(thisdone) {
					var oldhandle = f.handle;
					f.handle = oldhandle.hishandle;

					return chain.storefile(f).then(function(res) {
						f.handle = oldhandle;
						thisdone();
						return res;
					});
				});
			},
			storedirectory: function(info) {
				return chain.storedirectory(info);
			},
			close: function(handle) {
				return chain.close(handle.hishandle);
			},
			destroy: function() {
				return chain.destroy();
			}
		}
	}

	return subcreate(null);
}

module.exports = {
	create: create
};