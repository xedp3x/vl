/**
 * Module dependencies.
 */

var express = require('express'),
    redis = require('redis'),
    socket = require('./socket.js');

var app = module.exports = express.createServer();
global.db = redis.createClient();
global.io = socket.listen(redis, app);

// Configuration

app.configure(function() {
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.set('view options', { layout : false });
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
	app.use(express.errorHandler());
});
