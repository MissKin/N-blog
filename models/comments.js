var Comment = require('../lib/mongo').Comment;
var marked = require('marked');

Comment.plugin('contentToHtml',{
  afterFind:function(comments){
    return comments.map(function(comment){
      comment.content = marked(comment.content);
      return comment;
    });
  }
});

module.exports = {
  //创建一个留言
  create:function create(comment){
    return Comment.create(comment).exec();
  },
  //通过用户id 和留言id 删除一个留言
  delCommentById:function delCommentById(commentId, author) {
    return Comment.remove({author:author, _id:commentId}).exec();
  },
  //通过文章id 删除文章下的所有留言
  delCommentsByPostId: function delCommentsByPostId(postId) {
    return Comment.remove({postId:postId}).exec();
  },
  //通过文章 id 获取该文章下所有留言，按留言创建时间升序
  getComments:function getComments(postId){
    return Comment.find({postId:postId})
      .populate({path:'author',model: 'User'})
      .sort({_id:1})
      .contentToHtml()
      .exec();
  },
//通过文章id 获取该文章下的留言数
  getCommentsCount: function getCommentsCount(postId){
    return Comment.count({postId:postId}).exec();
  }
};