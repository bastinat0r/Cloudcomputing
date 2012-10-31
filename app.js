var express = require('express');
var util = require('util');
var userDB = require('./db.js');
var fs = require('fs');
var https = require('https');
var http = require('http');
var pub = __dirname + '/htdocs/public';

var httpPort = (process.env.port || 80);
var httpsPort = 443;

var app = express();

var MemStore = express.session.MemoryStore;
var httpBaseUrl = "http://bastinat0r.azurewebsites.net";
var httpsBaseUrl = "https://bastinat0r.azurewebsites.net";

app.use(express.static(pub)); // folder for static shit like css
app.use(express.favicon());		// ignore chrome-favicon-requests
app.use(express.errorHandler());
app.use(express.cookieParser('manny is cool'));
app.use(express.bodyParser());
//app.use(express.methodOverride());
var store = MemStore({reapInterval: 60000 * 10});
app.use(express.session({secret: 'alessios', store : store}));
app.use(app.router);

app.set('view engine', 'jade');
app.set('views', __dirname + '/htdocs/views');

app.get('/', function(req, res){
	if(typeof(req.headers["https-proxy"]) == "undefined") {
		req.session.secure = false;		
	}
  res.render('home', {session : req.session, httpBaseUrl : httpBaseUrl, httpsBaseUrl : httpsBaseUrl});
});
app.get('/users', function(req, res) {
	if(typeof(req.headers["https-proxy"]) == "undefined") {
		req.session.secure = false;		
	}
	res.render('users', {session : req.session, httpBaseUrl : httpBaseUrl, httpsBaseUrl : httpsBaseUrl});
});
app.get('/login', function(req, res) {
	if(typeof(req.headers["https-proxy"]) == "undefined") {
		req.session.secure = false;		
	}
	res.render('login', {httpBaseUrl : httpBaseUrl, httpsBaseUrl : httpsBaseUrl});
});
app.get('/register', function(req, res) {
	if(typeof(req.headers["https-proxy"]) == "undefined") {
		req.session.secure = false;		
	}
	res.render('register', {httpBaseUrl : httpBaseUrl, httpsBaseUrl : httpsBaseUrl});
});
app.get('/profile', function(req, res) {
	if(typeof(req.headers["https-proxy"]) == "undefined") {
		req.session.secure = false;		
	}
	if(req.session.name) {
		res.render('profile', {session : req.session, httpBaseUrl : httpBaseUrl, httpsBaseUrl : httpsBaseUrl});
	} else {
		res.redirect('login');
	}
});
app.get('/secure', function(req, res) {
	if(typeof(req.headers["https-proxy"]) == "undefined") {
		req.session.secure = false;		
	}
	if(req.session.name && req.session.secure) {
		res.render('profile', {session : req.session, httpBaseUrl : httpBaseUrl, httpsBaseUrl : httpsBaseUrl});
	} else {
		res.redirect('login');
	}
});

app.get('/logout', function(req, res) {
	if(typeof(req.headers["https-proxy"]) == "undefined") {
		req.session.secure = false;		
	}
	req.session.destroy(function() {
		res.redirect('/');
	});
});

app.post('/login', function(req, res) {
	auth(req, res);
});

app.post('/register', function(req, res) {
	userDB.register({name : req.body.name, pass : req.body.pass, mail  : req.body.mail}, function(success) {
		if(success) 
			require('timers').setTimeout(auth, 300, req, res);
		else
			res.render('register', {error : 'name already in use', httpBaseUrl : httpBaseUrl, httpsBaseUrl : httpsBaseUrl});
	});
});


app.listen(httpPort);
console.log('Express app started on port ' + httpPort);

function auth(req, res) {
	userDB.validate({name : req.body.name, pass: req.body.pass}, function(valid) {
		if(valid) {
			util.puts(req.session.id);
			req.session.regenerate(function(err) {
			
				util.puts(req.session.id);
				req.session.name = req.body.name;
				req.session.secure = true;
				res.redirect('profile');
			});
			//res.render('profile', {name : r<F3>eq.session.user});
		} else {
			res.writeHead(403);
			res.end('403 - Forbidden!');
		}
	});
};

function validateCookie(cb) {
	cb('foo');
}

cert = {
	key : fs.readFileSync('server.key'),
	cert : fs.readFileSync('server.crt')
}

var proxy_srv = https.createServer(cert, function (req, res) {
	var proxy_opts = {
		path : req.url,
		port : httpPort,
		host : "localhost",
		method : req.method,
		headers : req.headers
	}
	proxy_opts.headers["https-proxy"] = "https";
	//util.puts(JSON.stringify(proxy_opts));
	var proxy_req = http.request(proxy_opts);
	proxy_req.on('response', function(proxy_res) {
		res.writeHead(proxy_res.statusCode, proxy_res.headers);
		proxy_res.on('data', function(chunk) {
			res.write(chunk);
		});
		proxy_res.on('end', function() {
			res.end();
		});
	});

	req.on('data', function(chunk) {
		proxy_req.write(chunk);
	});

	req.on('end', function() {
		proxy_req.end();
	});
});
proxy_srv.listen(httpsPort);
proxy_srv.on('error', util.puts);
util.puts('https on port ' + httpsPort);
