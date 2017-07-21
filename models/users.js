var User = require('../lib/mongo').User;

module.exports ={
  //注册一个用户  mongo
  create:function create(user){
    return User.create(user).exec();
  },

  getUsersByName :function getUsersByName(name) {
    return User
      .findOne({name:name})
      .addCreatedAt()
      .exec();
  }
};