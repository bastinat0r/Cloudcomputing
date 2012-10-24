var express = require('express');
var util = require('util');
var mongoose = require('mongoose'),
		Schema = mongoose.Schema;
var mongooseAuth = require('mongoose-auth');

var pub = __dirname + '/htdocs/public';


var app = express();

var userSchema = new Schema({});
var User;

userSchema.plugin(mongooseAuth, {
	everymodule : {
		everyauth : {
			User : function() {
				return User;
			}
		}
	},
	password : {
		everyauth : {
			getLoginPath : '/login',
			postLoginPath : '/login',
			loginView : 'login',
			getRegisterPath : '/register',
			postRegisterPath: '/register',
			registerView : 'register',
			loginSuccessRedirect : '/profile',
			registerSuccessRedirect: '/profile'

		}
	}
});


var MemStore = express.session.MemoryStore;

app.use(express.static(pub)); // folder for static shit like css
app.use(express.favicon());		// ignore chrome-favicon-requests
app.use(express.errorHandler());
app.use(express.cookieParser('manny is cool'));
app.use(express.bodyParser());
//app.use(express.methodOverride());
app.use(express.session({secret: 'alessios', store: MemStore({
	reapInterval: 60000 * 10
})}));
app.use(app.router);

app.set('view engine', 'jade');
app.set('views', __dirname + '/htdocs/views');

app.get('/', function(req, res){
  res.render('home', req.session.user);
});
app.get('/users', function(req, res) {
	res.render('users', req.session.user);
});
app.get('/login', function(req, res) {
	res.render('login');
});
app.get('/register', function(req, res) {
	res.render('register');
});
app.get('/profile', function(req, res) {
	if(req.session.user) {
		res.render('profile', req.session.user);
	} else {
		res.redirect('login');
	}
});
app.get('/logout', function(req, res) {
	req.session.destroy(function() {
		res.redirect('/');
	});
});

app.post('/login', function(req, res) {
	auth(req, res);
});

app.post('/register', function(req, res) {
	auth(req, res);
});


app.listen(process.env.port || 3000);
console.log('Express app started on port 3000');

function auth(req, res) {
	userDB.validate({name : req.body.name, pass: req.body.pass}, function(valid) {
		if(valid) {
			req.session.user = { name : req.body.name };
			res.redirect('profile');
			//res.render('profile', {name : req.session.user});
		} else {
			res.writeHead(403);
			res.end('403 - Forbidden!');
		}
	});
};

function validateCookie(cb) {
	cb('foo');
}
