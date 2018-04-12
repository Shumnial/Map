const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const _ = require('lodash');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const routes = require('./routes/index');
const starter = require('./routes/starter');
const nunjucks = require('nunjucks');
const filters = require('./filters/filters');
const app = express();
const generate = require('nanoid/generate');


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

var env = nunjucks.configure('views', {
    autoescape: false,
    express: app,
    watch: true
});

filters.hash = generate('1234567890abcdef', 10);

_.each(filters, (func, name) => {
  if (name !== 'export') {
    env.addFilter(name, func);
  }
});


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


if (app.get('env') === 'development') {
  app.use('/starter', starter);
}

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
