//Mongoose 用户模型定义（Schema）
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,//必填
    min: 3,
    max: 20,
    unique: true,//唯一性
  },
  email: {
    type: String,
    required: true,
    unique: true,
    max: 50,
  },
  password: {
    type: String,
    required: true,
    min: 8,
  },
  isAvatarImageSet: {
    type: Boolean,
    default: false,
  },
  avatarImage: {
    type: String,
    default: "",
  },
});

//根据userSchema建立一个名为Users的模型
//可以在其他地方通过这个模型操作数据库中的 users 集合
module.exports = mongoose.model("Users", userSchema);
