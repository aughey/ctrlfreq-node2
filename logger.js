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
				console.log("Stored directory: " + info.path)
				console.log(info);
				return res;
			})
		}
	});
}

module.exports = {
	create: create
};