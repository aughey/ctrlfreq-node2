var fs = require('fs');
var _ = require('underscore');
var Q = require('q');

var cachecount = 0;

function create(chain, cachefile) {
	if (!cachefile) {
		cachefile = "cache.json";
	}
	var filecache = {};
	try {
		filecache = JSON.parse(fs.readFileSync(cachefile));
		console.log("Loaded filecache");
	} catch (e) {
		filecache = {};
	}


	var me = {
		opendir: function(dir) {
			return chain.opendir(dir);
		},
		storefile: function(info) {
			var cache = filecache[info.fullpath];
			if (cache) {
				if (_.isEqual(info.stat, cache.info.stat)) {
					//console.log("Not storing, cached: " + info.fullpath);
					return Q(cache.r);
				}
			}
			return chain.storefile(info).then(function(res) {
				if (res) {	
					filecache[info.fullpath] = {
						info: info,
						r: res
					}			
				}
				return res;
			});
		},
		storedirectory: function(info) {
			return chain.storedirectory(info);
		},
		dirdone: function(handle) {
			return chain.dirdone(handle);
		},
		close: function(handle) {
			return chain.close(handle);
		},
		destroy: function() {
			fs.writeFileSync(cachefile, JSON.stringify(filecache));
			return chain.destroy();
		}
	};
	return me;
}

module.exports = {
	create: create
}