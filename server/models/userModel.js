const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    min: 3,
    max: 20,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    max: 50,
    trim: true,
    lowercase: true,
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
  isAI: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Users", userSchema);
