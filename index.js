var path = require('path');
var express = require('express');
var logger = require('morgan');
var fs = require('fs');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var flash = require('connect-flash');
var config = require('config-lite')(__dirname);
var routes = require('./routes');
var pkg = require('./package');

var app = express();
var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'),{flag:'a'});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  name: config.session.key,
  secret: config.session.secret,
  resave: true,
  saveUninitialized: false,
  cookie:{
    maxAge: config.session.maxAge
  },
  store: new MongoStore({
	url:config.mongodb
  })
}));

app.use(flash());

app.use(require('express-formidable')({
  uploadDir:path.join(__dirname,'public/img'),
  keepExtensions:true
}));

//设置模板全局常量
app.locals.blog = {
  title:pkg.name,
  description:pkg.description
};

//添加模板必需的三个变量
app.use(function (req, res, next) {
  res.locals.user = req.session.user;
  res.locals.success = req.flash('success').toString();
  res.locals.error = req.flash('error').toString();
  next();
});

//日志
app.use(logger('combined',{stream: accessLogStream}));

routes(app);

//err page
app.use(function(err, req, res, next){
  res.render('error',{
    error:err
  });
});

/*app.listen(config.port,function () {
  console.log('request for server!')
});*/

if(module.parent){
  module.exports = app;
} else {
  app.listen(config.port,function () {
	console.log(`${pkg.name} listening on port ${config.port}`);
  });
}

