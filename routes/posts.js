var express = require('express');
var router = express.Router();

var PostModel = require('../models/posts');
var CommentModel = require('../models/comments');
var checkLogin = require('../middlewares/check').checkLogin;

router.get('/',function (req, res,next) {
 var author = req.query.author;

 PostModel.getPosts(author)
   .then(function (posts) {
     res.render('posts',{posts:posts});
   }).catch(next);
});

router.get('/create', checkLogin, function(req, res, next) {
  res.render('create');
});

// GET /posts/:postId 单独一篇的文章页
router.get('/:postId', function(req, res, next) {
  var postId = req.params.postId;

  Promise.all([
	PostModel.getPostById(postId),// 获取文章信息
	CommentModel.getComments(postId),//获取留言
	PostModel.incPv(postId)// pv 加 1
  ])
	.then(function (result) {
	  var post = result[0];
	  var comments = result[1];
	  if (!post) {
		throw new Error('该文章不存在');
	  }
	  res.render('post', {
		post: post,
		comments:comments
	  });
	})
	.catch(next);
});



router.post('/',checkLogin,function (req, res, next) {
  var title = req.fields.title;
  var author = req.session.user._id;
  var content = req.fields.content;

  try{
    if(!title.length){
      throw new Error('标题不可为空');
    }
    if(!content.length){
      throw new Error('内容不可为空')
    }
  }catch (e){
    req.flash('error',e.message);
    return res.redirect('back');
  }

  var post ={
    author:author,
    title:title,
    content:content,
    pv:0
  };
  PostModel.create(post)
    .then(function (result) {
      post = result.ops[0];
      req.flash('success','成功发表');
      res.redirect(`/posts/${post._id}`);
	})
    .catch(next);
});

router.get('/:postId/edit',checkLogin,function (req, res, next) {
  var postId = req.params.postId;
  var author = req.session.user._id;

  PostModel.getRawPostById(postId)
	.then(function(post){
	  if(!post){
	    throw new Error('文章不存在');
	  }
	  if(author.toString() !== post.author._id.toString()){
	    throw new Error('权限不足');
	  }
	  res.render('edit', {
	    post:post
	  });
	})
	.catch(next);
});

router.post('/:postId/edit',checkLogin,function (req, res, next) {
  var postId = req.params.postId;
  var author = req.session.user._id;
  var title = req.fields.title;
  var content = req.fields.content;

 PostModel.updatePostById(postId,author,{title:title,content:content} )
   .then(function(){
     req.flash('success','编辑文章成功');
     res.redirect(`/posts/${postId}`);
   })
   .catch(next)
});

router.get('/:postId/remove',checkLogin,function (req, res, next) {
  var postId = req.params.postId;
  var author = req.session.user._id;

  PostModel.delPostById(postId, author)
	.then(function(){
	  req.flash('success','删除成功');
	  res.redirect('/posts');
	}).catch(next);

});

router.post('/:postId/comment',checkLogin,function (req, res, next) {
  var author = req.session.user._id;
  var postId = req.params.postId;
  var content = req.fields.content;
  var comment = {
    author: author,
	postId: postId,
	content:content
  };

  CommentModel.create(comment)
	.then(function(){
	  req.flash('success','留言成功');
	  res.redirect('back');
	})
	.catch(next);
});

router.post('/:postId/comment/:commentId/remove',checkLogin,function (req, res, next) {
 var author = req.session.user._id;
 var commentId = req.params.commentId;

 CommentModel.delCommentById(commentId,author)
   .then(function(){
     req.flash('success','删除成功');
     res.redirect('back');
   }).catch(next);

});

module.exports = router;
