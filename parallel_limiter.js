var Q = require('q');
var limit = require('./limit').limit;

function create(chain) {
	var dirlimit = limit(3, "dirlimit");
	var filelimit = limit(10,"filelimit");

	function subcreate(whendone,dir) {
		return {
			opendir: function(dirname) {
				return dirlimit(dirname).then(function(thisdone) {
					return chain.opendir(dirname).then(function() {
						return subcreate(thisdone,dirname);
					});
				});
			},
			dirdone: function() {
				if(whendone) {
					whendone();
				}
			},
			storefile: function(f) {
				return filelimit(f.fullpath).then(function(thisdone) {
					return chain.storefile(f).then(function(res) {
						thisdone();
						return res;
					});
				});
			},
			close: function() {
				return chain.close();
			}
		}
	}

	return subcreate(null);
}

module.exports = {
	create: create
};