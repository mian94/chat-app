const { normalizeOriginalFilename } = require("./filename");

function normalizeMessageContent(message) {
  if (typeof message === "string") {
    return {
      text: message.trim(),
      mediaUrl: null,
      mediaType: null,
      fileName: null,
    };
  }

  if (typeof message !== "object" || message === null) {
    return null;
  }

  return {
    text: typeof message.text === "string" ? message.text.trim() : "",
    mediaUrl: typeof message.mediaUrl === "string" && message.mediaUrl.trim()
      ? message.mediaUrl.trim()
      : null,
    mediaType: typeof message.mediaType === "string" && message.mediaType.trim()
      ? message.mediaType.trim()
      : null,
    fileName: typeof message.fileName === "string" && message.fileName.trim()
      ? normalizeOriginalFilename(message.fileName)
      : null,
  };
}

function hasMessageContent(message) {
  return Boolean(message && (message.text || message.mediaUrl));
}

module.exports = {
  hasMessageContent,
  normalizeMessageContent,
};
