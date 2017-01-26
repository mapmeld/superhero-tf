// app.js - KoaJS server

// NodeJS core
const path = require('path');

// Koa NPM stuff
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const convert = require('koa-convert');
const session = require('koa-generic-session');
const MongoStore = require('koa-generic-session-mongo');
const jade = require('koa-jade-render');
const logger = require('koa-logger');
const router = require('koa-router')();
const compression = require('koa-compress');
//const CSRF = require('koa-csrf').default;
const kstatic = require('koa-static');

var app = new Koa();
app.use(jade(path.join(__dirname, 'views')));

app.use(convert(kstatic(__dirname + '/static')));
app.use(bodyParser({
  jsonLimit: '1mb',
  textLimit: '1mb',
  formLimit: '1mb'
}));
app.use(compression());

// MongoDB connector
app.keys = [process.env.KEY1 || 'your-session-secret', process.env.KEY2 || 'another-session-secret'];

/*
app.use(new CSRF({
  invalidSessionSecretMessage: 'Invalid session secret',
  invalidSessionSecretStatusCode: 403,
  invalidTokenMessage: 'Invalid CSRF token',
  invalidTokenStatusCode: 403
}));
*/

const mongoose = require('mongoose');
console.log('connecting to MongoDB...');
mongoose.connect(process.env.MONGODB_URI || 'localhost');
app.use(convert(session({
  store: new MongoStore()
})));

// app.use(logger());

const routes = require('./routes');
// const login = require('./login');
const spawn = require('./spawn-compiled');
router.get('/', routes.home)
  .post('/spawn', spawn.spawn)
  .get('/experiments', routes.experiments)
  .get('/experiments/:experiment', routes.experiment)
  .get('/results/:id', routes.result);

app.use(router.routes())
  .use(router.allowedMethods());

app.listen(process.env.PORT || 8080);

module.exports = app;
