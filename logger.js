var Q = require('q');
var c = require('./chain');

function create(chain) {
	return c.extend(chain,{
		storefile: function(info) {
			return chain.storefile(info).then(function(res) {
				if(res) {
					console.log("Stored file: " + info.fullpath);
				}
				return res;
			});
		},
		storedirectory: function(info) {
			return chain.storedirectory(info).then(function(res) {
				if(!res.cached) {
					console.log("Stored directory: " + info.data.path)
				}
				return res;
			})
		}
	});
}

module.exports = {
	create: create
};