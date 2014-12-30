var fs = require('fs');
var limit = require('./limit').limit;
var Q = require('q');
var zlib = require('zlib');

function create(store) {
	var readlimit = limit(100, "readlimit");

	var me = {
		opendir: function() {
			return Q();
		},
		dirdone: function() {

		},
		storefile: function(info,handle) {
			// We're returning our own deferred here to own our own promise chain.
			var deferred = Q.defer();

			var chunks = [];
			var outstanding = 1;

			function checkdone(error) {
				outstanding -= 1;
				if (outstanding === 0) {
					deferred.resolve(error ? null : chunks);
				}
			}

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
								store.save(compressed_buffer).then(function(uuid) {
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

		},
		destroy: function() {
			return store.destroy();
		}
	};
	return me;
}

module.exports = {
	create: create
};