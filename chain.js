var _ = require ('underscore');

function extend(chain,obj) {
	var me = {
		opendir: function(dir) {
			return chain.opendir(dir);
		},
		storefile: function(info) {
			return chain.storefile(info);
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
			return chain.destroy();
		}
	};
	_.each(obj,function(v,k) {
		me[k] = v;
	});
	return me;
}

module.exports = {
	extend: extend
};