var fs = require('fs');
var _ = require('underscore');
var Q = require('q');

var cachecount = 0;

function init(cachefile, chain) {
	var filecache = {};
	try {
		filecache = JSON.parse(fs.readFileSync(cachefile));
		console.log("Loaded filecache");
	} catch (e) {
		filecache = {};
	}
	var newcache = filecache;

	function writecache(info) {
		newcache[info.fullpath] = {
			stat: info.stat
		};
	}

	var me = {
		opendir: function(dir) {
			return chain.opendir(dir);
		},
		storefile: function(info, handle) {
			var cache = filecache[info.fullpath];
			if (cache) {
				if (_.isEqual(info.stat, cache.stat)) {
					//console.log("Not storing, cached: " + info.fullpath);
					writecache(info);
					return Q();
				}
			}
			return chain.storefile(info, handle).then(function(res) {
				writecache(info);
				return res;
			});
		},
		dirdone: function(handle) {
			return chain.dirdone(handle);
		},
		close: function(handle) {
			return chain.close(handle);
		},
		destroy: function() {
			fs.writeFileSync(cachefile, JSON.stringify(newcache));
			return chain.destroy();
		}
	};
	return me;
}

module.exports = {
	init: init
}