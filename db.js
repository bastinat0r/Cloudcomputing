var Mongoose = require('mongoose');
var util = require('util');
var crypto = require('crypto');

var usersDB = Mongoose.createConnection('mongodb://cloud:computing@bastinat0r.de:27017/users');
usersDB.on('error', util.puts);
var schema = new Mongoose.Schema({
	name : String,
	pass : String,
	mail : String
});

var users = usersDB.model('User', schema);

function validate(user, cb) {
	var hash = crypto.createHash('sha256').update(user.pass);
	users.find({name:user.name}, function(err, dbUser) {
		util.puts('got user from db:' + JSON.stringify(dbUser));
		if(dbUser.length<1)
			cb(false);
		else
			cb(dbUser[0].pass === hash.digest('base64'));
	});
}

function register(user, cb) {
	users.find({name:user.name}, function(err, dbUser) {
		util.puts('got user from db:' + JSON.stringify(dbUser));
		if(dbUser.length > 0)
			cb(false);
		else {
			var hash = crypto.createHash('sha256');
			hash.update(user.pass);
			var dbUser = {'name' : user.name, 'pass': hash.digest('base64'), mail : user.mail};
			util.puts("trying to insert " + JSON.stringify(dbUser));
			users.create(dbUser, function(err, test) {
				if(err) util.puts(err);
				util.puts(JSON.stringify(test));
			});
			cb(true);
		}
	});
}


exports.validate = validate;
exports.register = register;
