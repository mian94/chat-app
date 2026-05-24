const SUSPICIOUS_LATIN1_PATTERN = /[\u00c0-\u017f]/g;
const CJK_PATTERN = /[\u3400-\u9fff]/g;

function countMatches(value, pattern) {
  return (value.match(pattern) || []).length;
}

function tryDecodeLatin1ToUtf8(value) {
  try {
    return Buffer.from(value, "latin1").toString("utf8");
  } catch (error) {
    return value;
  }
}

function normalizeOriginalFilename(filename) {
  if (typeof filename !== "string") {
    return "";
  }

  const trimmedFilename = filename.trim();
  if (!trimmedFilename) {
    return "";
  }

  const decodedFilename = tryDecodeLatin1ToUtf8(trimmedFilename);
  if (!decodedFilename || decodedFilename.includes("\uFFFD")) {
    return trimmedFilename;
  }

  const originalCjkCount = countMatches(trimmedFilename, CJK_PATTERN);
  const decodedCjkCount = countMatches(decodedFilename, CJK_PATTERN);
  if (decodedCjkCount > originalCjkCount) {
    return decodedFilename;
  }

  const originalSuspiciousCount = countMatches(trimmedFilename, SUSPICIOUS_LATIN1_PATTERN);
  const decodedSuspiciousCount = countMatches(decodedFilename, SUSPICIOUS_LATIN1_PATTERN);
  if (originalSuspiciousCount > decodedSuspiciousCount) {
    return decodedFilename;
  }

  return trimmedFilename;
}

module.exports = {
  normalizeOriginalFilename,
};
