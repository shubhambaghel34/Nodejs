const createError = require("http-errors");
const express = require("express");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const mongoose = require("mongoose");
const cors = require('cors');
const passport = require('passport');
require('dotenv').config();

const apiRouter = require('./routes/api_route');

const {
  DB_HOST: db_host,
  DB_NAME: db_name,
  COOKIE_AUTH: cookie_auth,
  TOKEN_AUTH: token_auth,
  SECRET_KEY: secret,
  API_BASE_URL: api_base_url
} = process.env;

if (cookie_auth == 'true') {
  var session = require("express-session");
  var MongoStore = require('connect-mongo')(session);
}

const app = express();

// app.use(express.static('public'));
// app.use(cors());
// app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

mongoose.connect(`mongodb://${db_host}/${db_name}`,{useNewUrlParser: true,useUnifiedTopology: true});
mongoose.Promise = global.Promise;
const db = mongoose.connection;

db.on('connected', function() {
  console.log('Database connected successfully');
});

db.on('error', function(err) {
  console.log('Error occured during database connection');
});

if (cookie_auth == 'true') {
  app.use(cookieParser());
  app.use(session({
      store: new MongoStore({
          url: `mongodb://${db_host}/${db_name}`,
      }),
      cookie: { maxAge: 1 * 60 * 60 * 1000 },
      secret: secret,
      resave: false,
      saveUninitialized: false
  }));
}

app.use(passport.initialize());
if (cookie_auth == 'true') {
  app.use(passport.session());
}

if (token_auth == 'true') {
  require('./passport-configs/passport-jwt-config')(passport);
}
if (cookie_auth == 'true') {
  require('./passport-configs/passport-local-config')(passport);
}

app.use(api_base_url, apiRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// TODO Web Template Studio: Add your own error handler here.
if (process.env.NODE_ENV === "production") {
  // Do not send stack trace of error message when in production
  app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.send("Error occurred while handling the request.");
  });
} else {
  // Log stack trace of error message while in development
  app.use((err, req, res, next) => {
    console.log(err);
    res.status(err.status || 500);
    res.send(err.message);
  });
}

module.exports = app;
