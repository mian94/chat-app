function formatMeta(meta) {
  if (!meta || Object.keys(meta).length === 0) {
    return "";
  }

  try {
    return ` ${JSON.stringify(meta)}`;
  } catch (error) {
    return ` ${String(meta)}`;
  }
}

function writeLog(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level}] ${message}${formatMeta(meta)}`;

  if (level === "ERROR") {
    console.error(line);
    return;
  }

  if (level === "WARN") {
    console.warn(line);
    return;
  }

  console.log(line);
}

module.exports = {
  error(message, meta) {
    writeLog("ERROR", message, meta);
  },
  info(message, meta) {
    writeLog("INFO", message, meta);
  },
  warn(message, meta) {
    writeLog("WARN", message, meta);
  },
};
