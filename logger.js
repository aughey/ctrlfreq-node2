var Q = require('q');

function create(chain) {
	return {
		opendir: function(dir) {
			return chain.opendir(dir).then(function(sub) {
				//	console.log("Opened dir " + dir);
				return create(sub);
			});
		},
		storefile: function(info) {
			return chain.storefile(info).then(function(res) {
				console.log("Stored file: " + info.fullpath);
				return res;
			});
		},
		dirdone: function() {
			return chain.dirdone();
		},
		close: function() {
			return chain.close();
		}
	}
}

module.exports = {
	create: create
};