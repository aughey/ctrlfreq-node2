var path = require('path');
var _ = require("underscore");
var Q = require("q");
var c = require('./chain');

function create(chain) {
	var extensions = "wab~,vmc,vhd,vo1,vo2,vsv,vud,vmdk,vmsn,vmsd,hdd,vdi,vmwarevm,nvram,vmx,vmem,iso,dmg,sparseimage,sys,cab,exe,msi,dll,dl_,wim,ost,o,qtch,log,tmp";
	extensions = extensions.split(',');
	extensions = _.map(extensions, function(p) {
		return "." + p;
	});
	exclude_count = 0;

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
			if (_.contains(extensions, ext) || _.contains(badfiles, file) || file.indexOf("~") === 0) {
				exclude_count += 1;
				return Q();
			} else {
				return chain.storefile(info);
			}
		},
		stats: function(s) {
			s.exclude_count = exclude_count;
			chain.stats(s);
		}
	});
}

module.exports = {
	create: create
}
