const multer = require("multer");
const logger = require("../utils/logger");

function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  const isMulterError = error instanceof multer.MulterError;

  logger.error("Request failed", {
    message: error.message,
    method: req.method,
    path: req.originalUrl,
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
    statusCode,
  });

  if (res.headersSent) {
    return next(error);
  }

  res.status(isMulterError && statusCode === 500 ? 400 : statusCode).json({
    success: false,
    message: isMulterError ? error.message : error.message || "Internal Server Error",
    details: error.details || null,
  });
}

module.exports = {
  errorHandler,
  notFound,
};
