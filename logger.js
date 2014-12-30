var Q = require('q');

function create(chain) {
	return {
		opendir: function(dir) {
			return chain.opendir(dir);
		},
		storefile: function(info,handle) {
			return chain.storefile(info,handle).then(function(res) {
				console.log("Stored file: " + info.fullpath);
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
			return chain.destroy();
		}
	}
}

module.exports = {
	create: create
};