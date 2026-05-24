const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { randomUUID } = require("crypto"); //生成随机文件名，避免重名覆盖
const AppError = require("../utils/AppError");
const { maxUploadSize, uploadDir } = require("../config/env");
const { normalizeOriginalFilename } = require("../utils/filename"); //修复和标准化原始文件名，解决中文乱码问题

const ALLOWED_UPLOAD_TYPES = {
  ".doc": ["application/msword"],
  ".docx": [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".mp4": ["video/mp4"],
  ".pdf": ["application/pdf"],
  ".png": ["image/png"],
  ".ppt": ["application/vnd.ms-powerpoint"],
  ".pptx": [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
  ".txt": ["text/plain"],
  ".xls": ["application/vnd.ms-excel"],
  ".xlsx": [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  ".zip": ["application/zip", "application/x-zip-compressed"],
};

//创建上传目录
fs.mkdirSync(uploadDir, { recursive: true });

//配置磁盘存储 storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  //决定文件最终保存时的名字
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname || "").toLowerCase(); //原后缀
    cb(null, `${Date.now()}-${randomUUID()}${extension}`);
  },
});

function fileFilter(req, file, cb) {
  file.originalname = normalizeOriginalFilename(file.originalname);

  const extension = path.extname(file.originalname || "").toLowerCase(); //取后缀名
  const allowedMimeTypes = ALLOWED_UPLOAD_TYPES[extension];
  const mimeType = (file.mimetype || "").toLowerCase();

  //校验后缀是否合法
  if (!allowedMimeTypes) {
    cb(new AppError("Unsupported file extension.", 400));
    return;
  }

  //校验 MIME 和后缀是否匹配
  if (!allowedMimeTypes.includes(mimeType)) {
    cb(new AppError("File type does not match its extension.", 400));
    return;
  }

  cb(null, true);
}

//创建 upload 中间件
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxUploadSize,
  },
});

//返回文件分类
function getUploadCategory(mimeType) {
  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  return "file";
}

module.exports = {
  getUploadCategory,
  upload,
};
