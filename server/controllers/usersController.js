const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const AppError = require("../utils/AppError");
const sanitizeUser = require("../utils/sanitizeUser");

module.exports.register = async (req, res, next) => {
  try {
    const username = req.body.username?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password?.trim();

    if (!username || !email || !password) {
      return next(new AppError("Username, email and password are required.", 400));
    }

    if (password.length < 8) {
      return next(new AppError("Password must be at least 8 characters.", 400));
    }

    const usernameCheck = await User.findOne({ username });
    if (usernameCheck) {
      return res.status(409).json({ msg: "Username already used", status: false });
    }

    const emailCheck = await User.findOne({ email });
    if (emailCheck) {
      return res.status(409).json({ msg: "Email already used", status: false });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      username,
      password: hashedPassword,
    });

    return res.status(201).json({ status: true, user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

module.exports.login = async (req, res, next) => {
  try {
    const username = req.body.username?.trim();
    const password = req.body.password?.trim();

    if (!username || !password) {
      return next(new AppError("Username and password are required.", 400));
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ msg: "Incorrect Username or Password", status: false });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ msg: "Incorrect Username or Password", status: false });
    }

    return res.json({ status: true, user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

module.exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({ _id: { $ne: req.params.id } }).select([
      "email",
      "username",
      "_id",
    ]);

    return res.json(users);
  } catch (error) {
    next(error);
  }
};

module.exports.logOut = async (req, res, next) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ msg: "User id is required" });
    }

    global.onlineUsers?.delete(req.params.id);
    return res.status(200).send();
  } catch (error) {
    next(error);
  }
};
