var fs = require('fs');
var limit = require('./limit').limit;
var Q = require('q');
var zlib = require('zlib');
var c = require("./chain");

function create(store) {
	var readlimit = limit(100, "readlimit");

	var filecount = 0;

	var me = c.extend(null,{
		opendir: function() {
			return Q();
		},
		dirdone: function() {

		},
		storedirectory: function(info) {
			return store.save_dir(info);
		},
		hasKey: function(key) {
			if(key.length === 0) {
				return Q(true);
			}
			var chunks = key.split(',');
			return store.has_chunks(chunks);
		},
		storefile: function(info) {
			// We're returning our own deferred here to own our own promise chain.
			var deferred = Q.defer();

			var chunks = [];
			var outstanding = 1;

			function checkdone(error) {
				outstanding -= 1;
				if (outstanding === 0) {
					if(error) {
						deferred.resolve(null);
					} else {
						info.key = chunks.join(',');
						info.keys = chunks;
						store.save_file(info).then(function() {
							deferred.resolve({
								key: chunks.join(',')
							})
						}).done();
					}
				}
			}
			filecount += 1;

			fs.open(info.fullpath, 'r', function(err, fd) {
				if (err) {
					console.log("Error: Couldn't read " + info.fullpath);
					deferred.resolve(null);
					return;
				}

				function readnext() {
					readlimit("Buffer").then(function(bufferdone) {
						var size = 1048576;
						var buffer = new Buffer(size);
						fs.read(fd, buffer, 0, size, null, function(err, bytesread, buffer) {
							if (err) {
								console.log("Error reading from " + info.fullpath);
								fs.close(fd);
								bufferdone();
								checkdone();
								return;
							}
							if (bytesread === 0) {
								fs.close(fd);
								bufferdone();
								checkdone();
								return;
							}
							// Resize the buffer to fit
							if (bytesread != size) {
								buffer = buffer.slice(0, bytesread);
							}
							var index = chunks.length;
							chunks.push(null);
							outstanding++;
							zlib.deflate(buffer, function(err, compressed_buffer) {
								store.save_chunk(compressed_buffer).then(function(uuid) {
									chunks[index] = uuid;
									bufferdone();
									checkdone();
								}).done();
								readnext();
							});
						});
					}).done();
				}

				readnext();
			});

			return deferred.promise;
		},
		close: function() {
			return Q();
		},
		destroy: function() {
			return store.destroy();
		},
		stats: function(s) {
			s.files_stored = filecount;

			store.stats(s);
		}
	});
	return me;
}

module.exports = {
	create: create
};