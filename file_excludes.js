var path = require('path');
var _ = require("underscore");
var Q = require("q");
var c = require('./chain');

function create(chain) {
	var extensions = "wab~,vmc,vhd,vo1,vo2,vsv,vud,vmdk,vmsn,vmsd,hdd,vdi,vmwarevm,nvram,vmx,vmem,iso,dmg,sparseimage,sys,cab,exe,msi,dll,dl_,wim,ost,o,qtch,log";
	extensions = extensions.split(',');
	extensions = _.map(extensions, function(p) {
		return "." + p;
	});

	var badfiles = [
		".DS_Store",
		"Thumbs.db"
	];
	badfiles = _.map(badfiles, function(f) {
		return f.toLowerCase();
	});
	return c.extend(chain,{
		storefile: function(info) {
			var file = info.file.toLowerCase();
			var ext = path.extname(file);
			if (_.contains(extensions, ext) || _.contains(badfiles, file)) {
				return Q();
			} else {
				return chain.storefile(info);
			}
		},
	});
}

module.exports = {
	create: create
}