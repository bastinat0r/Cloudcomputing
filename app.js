var express = require('express');
var util = require('util');
var querystring = require('querystring');

var pub = __dirname + '/htdocs/public';


var app = express();
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
  res.render('home');
});
app.get('/users', function(req, res) {
	res.render('users', {'name' : 'foobar'});
});
app.get('/login', function(req, res) {
	res.render('login');
});
app.get('/register', function(req, res) {
	res.render('register');
});
app.get('/profile', function(req, res) {
	if(req.session.user) {
		res.render('profile', {name : req.session.user});
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


app.listen(3000);
console.log('Express app started on port 3000');

function auth(req, res) {
	validateUser({name : req.body.name, pass: req.body.pass}, function(valid) {
		if(valid) {
			req.session.user = req.body.name;
			res.redirect('profile');
			//res.render('profile', {name : req.session.user});
		} else {
			res.writeHead(403);
			res.end('403 - Forbidden!');
		}
	});
};

function validateUser(user, cb) {
	cb(user.name == 'foo' && user.pass == 'bar');
}

function validateCookie(cb) {
	cb('foo');
}