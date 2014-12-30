var Q = require('q');
var limit = require('./limit').limit;

function create(chain) {
	var dirlimit = limit(5, "dirlimit");
	var filelimit = limit(10,"filelimit");

	function subcreate(dir) {
		return {
			opendir: function(dirname) {
				return dirlimit(dirname).then(function(thisdone) {
					var myhandle = {
						whendone: thisdone
					};
					return chain.opendir(dirname).then(function(hishandle) {
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
			storefile: function(f,handle) {
				return filelimit(f.fullpath).then(function(thisdone) {
					return chain.storefile(f,handle.hishandle).then(function(res) {
						thisdone();
						return res;
					});
				});
			},
			close: function(handle) {
				return chain.close(handle);
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