const path = require("path");
require("dotenv").config(); //把 .env 文件里的配置加载到 process.env 里

//这是默认允许访问后端的前端地址列表
const DEFAULT_CLIENT_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://8.137.53.3:3000",
];

function parseOrigins(value) {
  if (!value) {
    return DEFAULT_CLIENT_ORIGINS;
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const port = Number(process.env.PORT) || 5000;
const mongoUrl = process.env.MONGO_URL || "";
const qwenApiKey = process.env.QWEN_API_KEY || "";
const clientOrigins = parseOrigins(process.env.CLIENT_ORIGINS);
const uploadDir = path.join(__dirname, "..", "uploads");
const maxUploadSize = Number(process.env.MAX_UPLOAD_SIZE_BYTES) || 10 * 1024 * 1024;
const mongoConnectTimeoutMs = Number(process.env.MONGO_CONNECT_TIMEOUT_MS) || 5000;

module.exports = {
  clientOrigins,
  maxUploadSize,
  mongoConnectTimeoutMs,
  mongoUrl,
  nodeEnv: process.env.NODE_ENV || "development",
  port,
  qwenApiKey,
  uploadDir,
};
