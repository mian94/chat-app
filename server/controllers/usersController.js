const User = require("../models/userModel");
const bcrypt = require("bcrypt");

module.exports.register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        const usernameCheck = await User.findOne({ username });
        if (usernameCheck)
        return res.json({ msg: "Username already used", status: false });
        const emailCheck = await User.findOne({ email });
        if (emailCheck)
        return res.json({ msg: "Email already used", status: false });
        const hashedPassword = await bcrypt.hash(password, 10);//对密码进行哈希加密
        const user = await User.create({
            email,
            username,
            password: hashedPassword,
        });
        delete user.password;//删除用户对象中的密码字段（防止返回给前端）
        return res.json({ status: true, user });
    } catch (ex) {
        next(ex);
    }
};

module.exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user)
      return res.json({ msg: "Incorrect Username or Password", status: false });
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.json({ msg: "Incorrect Username or Password", status: false });
    delete user.password;
    return res.json({ status: true, user });
  } catch (ex) {
    next(ex);
  }
};

module.exports.getAllUsers = async (req, res, next) => {
  try {
    //获取所有 _id 不等于 req.params.id 的用户。($ne 是 MongoDB 的操作符，表示 “不等于”)
    const users = await User.find({ _id: { $ne: req.params.id } }).select([
      "email",
      "username",
      "_id",
    ]);
    return res.json(users);
  } catch (ex) {
    next(ex);
  }
};