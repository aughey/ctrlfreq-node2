var fs = require('fs');
var _ = require('underscore');
var Q = require('q');
var c = require("./chain");
var kv = require('./kv.js')

var cachecount = 0;

function create(chain, cachefile) {
	var cache = null;

	var cache_hits = 0;
	var cache_misses = 0;
	var cache_failures = 0;

	var me = c.extend(chain, {
		opendir: function(dir) {
			return chain.opendir(dir);
		},
		storefile: function(info) {
			var key = info.fullpath;
			return cache.has(key).then(function(cached) {
				if(cached) {
					cached = JSON.parse(cached);
					if (_.isEqual(info.stat, cached.info.stat)) {
						//console.log("Not storing, cached: " + info.fullpath);
						return chain.hasKey(cached.r.key).then(function(has) {
							if(has) {
								cache_hits += 1;
								return Q(cached.r);
							} else {
								cache_failures += 1;
								return actually_store();
							}
						});
					} else {
						return actually_store();
					}
				} else {
					return actually_store();
				}
			});

			function actually_store() {
				cache_misses++;
				return chain.storefile(info).then(function(res) {
					if (res) {
						var cached = {
							info: info,
							r: res
						}
						return cache.put(key,JSON.stringify(cached)).then(function() {
							return res;
						})
					} else {
						return null;
					}
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
			s.file_cache_misses = cache_misses;
			s.file_cache_failures = cache_failures;
			return chain.stats(s);
		},
		destroy: function() {
			return chain.destroy().then(function() {
				return cache.close();
			});
		}
	});

	return kv.create("cache").then(function(c) {
		cache = c;
		return me;
	});
}

module.exports = {
	create: create
}