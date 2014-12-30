//var si = require('search-index');
var Q = require('q');
var _ = require('underscore');
var request = require('request');
var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;

function create(chain) {
	var filters = ['fullpath'];
	var batch = [];

	function getContent(fullpath) {
		var deferred = Q.defer();

		var file = fullpath.toLowerCase();
		var ext = path.extname(file);
		var extensions  = ['.md', '.c', '.h', '.js'];
		extensions = ['.doc'];
		if (_.contains(extensions, ext) || _.contains(["README"], file)) {
			if (true) {
				var child = spawn('/usr/bin/catdoc', [fullpath]);
				var content = "";
				child.stdout.on('data', function(data) {
                                    content = content + data.toString();
				});
				child.stderr.on('data', function(data) {
                                    console.log("ERR: " + data);
				});
				child.on('close', function() {
                                    console.log("CLOSE");

					deferred.resolve(content);
				})
			} else {
				deferred.resolve(fs.readFileSync(file).toString());
			}
		} else {
			deferred.resolve(null);
		}

		return deferred.promise;
	}

	function processBatch() {
		var deferred = Q.defer();

		if (batch.length == 0) {
			deferred.resolve(null);
			return deferred.promise;
		}

		var formdata = {
			document: JSON.stringify(batch)
		}
		console.log("Posting " + batch.length + " documents to the indexer")
		//console.log(batch);
		batch = [];

		request.post({
			url: "http://localhost:3030/indexer",
			formData: formdata
		}, function(error, response, body) {
			console.log("indexer posted")
			console.log(body)
			deferred.resolve(null);
		});

		return deferred.promise;
	}

	function processBatchz() {
		console.log(batch);
		return Q.ninvoke(si, 'add', {
			batchName: 'files',
			filters: filters
		}, batch).then(function(err) {
			console.log("indexed " + err);
		})
	}

	return {
		opendir: function(dir) {
			return chain.opendir(dir);
		},
		storefile: function(info) {
			return chain.storefile(info).then(function(res) {
				return getContent(info.fullpath).then(function(content) {
					var document = _.pick(info, ['fullpath']);
					document.key = res;

                                        if(content) {
  					  document.content = content.slice();
                                        }
					batch.push(document);
					if (batch.length >= 10) {
						return processBatch().then(function() {
							return res;
						})
					} else {
						return res;
					}
				});
			});
		},
		dirdone: function(handle) {
			return chain.dirdone(handle);
		},
		close: function(handle) {
			return chain.close(handle);
		},
		destroy: function() {
			var deferred = Q.defer();

			chain.destroy().then(processBatch).then(function() {
				/*				
				si.tellMeAboutMySearchIndex(function(msg) {
					console.log("Search Index: ");
					console.log(msg);
					deferred.resolve(null);
				})
*/
				deferred.resolve(null);
			}).done();
			return deferred.promise;
		}
	}
}

module.exports = {
	create: create
}
