var crypto = require('crypto');

module.exports = {
	hash: function(buffer) {
		var shasum = crypto.createHash('sha1');
		shasum.update(buffer);
		return shasum.digest('hex');
	}
}