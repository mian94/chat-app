//用户脱敏工具
function sanitizeUser(userDocument) {
  if (!userDocument) {
    return null;
  }

  const user = typeof userDocument.toObject === "function"
    ? userDocument.toObject()
    : { ...userDocument };

  delete user.password;
  return user;
}

module.exports = sanitizeUser;
