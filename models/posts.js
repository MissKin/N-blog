var Post = require('../lib/mongo').Post;
var marked = require('marked');
var CommentModel = require('./comments');

// 将 post 的 content 从 markdown 转换成 html
Post.plugin('contentToHtml', {
  afterFind: function (posts) {
	return posts.map(function (post) {
	  post.content = marked(post.content);
	  return post;
	});
  },
  afterFindOne: function (post) {
	if (post) {
	  post.content = marked(post.content);
	}
	return post;
  }
});

//给post 添加留言数 commentsCount
Post.plugin('addCommentsCount',{
  afterFind:function(posts){
    return Promise.all(posts.map(function(post){
      return CommentModel.getCommentsCount(post._id).then(function(commentsCount){
        post.commentsCount = commentsCount;
        return post;
	  });
	}));
  },
  afterFindOne: function(post){
    if(post){
	  return CommentModel.getCommentsCount(post._id).then(function (count) {
		post.commentsCount = count;
		return post;
	  });
	}
	return post;
  }
});

module.exports ={
  //创建一篇文章
  create:function create(post){
    return Post.create(post).exec();
  },

  // 通过文章 id 获取一篇文章
  getPostById: function getPostById(postId) {
	return Post
	  .findOne({ _id: postId })
	  .populate({ path: 'author', model: 'User' })
	  .addCreatedAt()
	  .addCommentsCount()
	  .contentToHtml()
	  .exec();
  },

  getPosts: function getPosts(author) {
	var query = {};
	if (author) {
	  query.author = author;
	}
	return Post
	  .find(query)
	  .populate({ path: 'author', model: 'User' })
	  .sort({ _id: -1 })
	  .addCreatedAt()
	  .addCommentsCount()
	  .contentToHtml()
	  .exec();
  },
  incPv:function incPv(postId){
    return Post
      .update({_id:postId}, {$inc:{pv:1}})
      .exec();
  },

  //通过文章id 获取一篇原生文章 （编辑文章）
  getRawPostById: function getRawPostById(postId){
    return Post
	  .findOne({_id: postId})
	  .populate({path:'author', model:'User'})
	  .exec();
  },
  //通过用户id 和文章id 更新一篇文章
  updatePostById:function updatePostById(postId,author,data ){
  return Post
	.update({author: author, _id:postId}, {$set: data})
	.exec();
  },
  //通过用户id 和文章id删除一篇文章
  delPostById:function delPostById(postId, author) {
	return Post.remove({author: author, _id: postId})
	  .exec()
	  .then(function(res){
	    //文章删除后，删除该文章下的所有留言
		if(res.result.ok && res.result.n > 0){
		  return CommentModel.delCommentsByPostId(postId);
		}
	  });
  }
};