'use strict';

//dependencies
var config = require('./config'),
    express = require('express'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    http = require('http'),
    path = require('path'),
    fs = require('fs'),
    path = require('path'),
    Sequelize = require('sequelize'),
    passport = require('passport'),
    helmet = require('helmet'),
    csrf = require('csurf');

//create express app
var app = module.exports = express();

//keep reference to config
app.config = config;

//setup the web server
app.server = http.createServer(app);

app.db = {};

app.useDB = function(db){ // pass in the sequelize instance to initialize models
  app.db = db;
  //config data models
  require('./models')(app, app.db);
};

//settings
app.disable('x-powered-by');
app.set('port', config.port);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//middleware
app.use(require('morgan')('dev'));
app.use(require('compression')());
app.use(require('serve-static')(path.join(__dirname, 'public')));
app.use(require('method-override')());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser(config.cryptoKey));
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: config.cryptoKey
}));
app.use(passport.initialize());
app.use(passport.session());
helmet(app);

//response locals
app.use(function(req, res, next) {
  res.locals.user = {};
  res.locals.user.defaultReturnUrl = req.user && req.user.defaultReturnUrl();
  res.locals.user.username = req.user && req.user.username;
  next();
});

//global locals
app.locals.projectName = app.config.projectName;
app.locals.copyrightYear = new Date().getFullYear();
app.locals.copyrightName = app.config.companyName;
app.locals.cacheBreaker = 'br34k-01';

//setup passport
require('./passport')(app, passport);

app.addRoutes = function() {
  //setup routes
  require('./routes')(app, passport);
}

//custom (friendly) error handler
app.use(require('./views/http/index').http500);

//setup utilities
app.utility = {};
app.utility.sendmail = require('./util/sendmail');
app.utility.slugify = require('./util/slugify');
app.utility.workflow = require('./util/workflow');

