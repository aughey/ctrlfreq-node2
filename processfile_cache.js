var fs = require('fs');
var _ = require('underscore');
var Q = require('q');
var c = require("./chain");

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

	var cache_hits = 0;
	var cache_failures = 0;

	var me = c.extend(chain, {
		opendir: function(dir) {
			return chain.opendir(dir);
		},
		storefile: function(info) {
			var cache = filecache[info.fullpath];
			if (cache) {
				if (_.isEqual(info.stat, cache.info.stat)) {
					//console.log("Not storing, cached: " + info.fullpath);
					return chain.hasKey(cache.r.key).then(function(has) {
						if(has) {
							cache_hits += 1;
							return Q(cache.r);
						} else {
							cache_failures += 1;
							return actually_store();
						}
					});
				}
			}

			function actually_store() {
				return chain.storefile(info).then(function(res) {
					if (res) {
						filecache[info.fullpath] = {
							info: info,
							r: res
						}
					}
					return res;
				});
			}
			return actually_store();
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
		stats: function(s) {
			s.file_cache_hits = cache_hits;
			s.file_cache_failures = cache_failures;
			return chain.stats(s);
		},
		destroy: function() {
			fs.writeFileSync(cachefile, JSON.stringify(filecache));
			return chain.destroy();
		}
	});
	return me;
}

module.exports = {
	create: create
}