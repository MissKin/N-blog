var sha1 = require('sha1');
var express = require('express');
var router = express.Router();

var UserModel = require('../models/users');
var checkNotLogin = require('../middlewares/check').checkNotLogin;

router.get('/',checkNotLogin,function (req, res, next) {
 res.render('signin');
});

router.post('/',checkNotLogin, function (req, res,next) {
  var name = req.fields.name;
  var password = req.fields.password;

  UserModel.getUsersByName(name)
    .then(function (user) {
      if(!user){
        req.flash('error','用户不存在');
        return res.redirect('back');
      }
      if(sha1(password) !== user.password){
        req.flash('error','用户名或者密码错误');
        return res.redirect('back')
      }
      req.flash('success','成功登录');
      delete user.password;
      req.session.user = user;
      res.redirect('/posts');
	})
    .catch(next);
});

module.exports = router;