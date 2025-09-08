var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config();
const mongoose = require('mongoose');
const Log = require('logging-middleware');

var indexRouter = require('./routes/index');
var shortUrlsRouter = require('./routes/shorturls');

var app = express();

// MongoDB connection
(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    await Log('backend', 'info', 'db', 'MongoDB connected successfully');
  } catch (err) {
    await Log('backend', 'fatal', 'db', `MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
})();

// Use logging middleware as the first middleware
app.use(async function(req, res, next) {
  await Log('backend', 'info', 'middleware', `Incoming request: ${req.method} ${req.originalUrl}`);
  next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/shorturls', shortUrlsRouter);

// Redirection route
const ShortUrl = require('./models/ShortUrl');
app.get('/:shortcode', async (req, res) => {
  const { shortcode } = req.params;
  const shortUrl = await ShortUrl.findOne({ shortcode });
  if (!shortUrl) {
    await Log('backend', 'warn', 'route', `Shortcode not found: ${shortcode}`);
    return res.status(404).json({ error: 'Shortcode not found' });
  }
  if (shortUrl.expiry < new Date()) {
    await Log('backend', 'warn', 'route', `Shortcode expired: ${shortcode}`);
    return res.status(410).json({ error: 'Shortcode expired' });
  }
  // Log click
  shortUrl.clicks.push({
    timestamp: new Date(),
    referrer: req.get('referer') || '',
    geo: req.ip // For demo, just IP; real geo would use a geo service
  });
  await shortUrl.save();
  await Log('backend', 'info', 'route', `Redirected: ${shortcode}`);
  res.redirect(shortUrl.url);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
