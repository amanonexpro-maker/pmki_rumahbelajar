/**
 * Encoding-Hardened Redirect Sanitizer (Fase 17 Step 2.1).
 * Implements fixed-point decode with depth cap, iterative fail-closed checks,
 * control character rejection, and path normalization before whitelist verification.
 * Fallback is ALWAYS safe "/workspace".
 */

const DANGEROUS_RAW_TOKENS = ["%2f", "%5c", "%00", "//", "\\"];
const DANGEROUS_CHAR_REGEX = /[\x00-\x1F\x7F\u200B-\u200D\uFEFF]/;

function hasDangerousTokens(str: string): boolean {
  if (DANGEROUS_CHAR_REGEX.test(str)) {
    return true;
  }
  if (str.includes("\\")) {
    return true;
  }
  if (str.includes("//")) {
    return true;
  }
  const lower = str.toLowerCase();
  for (const token of DANGEROUS_RAW_TOKENS) {
    if (lower.includes(token)) {
      return true;
    }
  }
  return false;
}

export function sanitizeRedirectUrl(url?: unknown): string {
  if (!url || typeof url !== "string") {
    return "/workspace";
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return "/workspace";
  }

  // 1. Initial check on raw input
  if (hasDangerousTokens(trimmed)) {
    return "/workspace";
  }

  // 2. Iterative fixed-point decode (depth cap = 4)
  const MAX_DEPTH = 4;
  let current = trimmed;
  let depth = 0;

  while (depth < MAX_DEPTH) {
    let decoded: string;
    try {
      decoded = decodeURIComponent(current);
    } catch {
      // Fail-closed on URIError (malformed percent encoding)
      return "/workspace";
    }

    if (hasDangerousTokens(decoded)) {
      return "/workspace";
    }

    if (decoded === current) {
      break;
    }

    current = decoded;
    depth++;
  }

  // If depth reached limit and still not fixed-point, reject
  if (depth >= MAX_DEPTH) {
    try {
      if (decodeURIComponent(current) !== current) {
        return "/workspace";
      }
    } catch {
      return "/workspace";
    }
  }

  // 3. Must start with single slash, not protocol or external
  if (!current.startsWith("/") || current.startsWith("//") || current.includes("://")) {
    return "/workspace";
  }

  // 4. Path normalization (resolve '.' and '..' segments, collapse multiple slashes)
  const rawSegments = current.split("/").filter((s) => s.length > 0 && s !== ".");
  const resolvedSegments: string[] = [];

  for (const seg of rawSegments) {
    if (seg === "..") {
      if (resolvedSegments.length === 0) {
        return "/workspace";
      }
      resolvedSegments.pop();
    } else {
      resolvedSegments.push(seg);
    }
  }

  const normalizedPath = "/" + resolvedSegments.join("/");

  // 5. Strict whitelist: must be "/workspace" or "/workspace/..."
  if (normalizedPath === "/workspace" || normalizedPath.startsWith("/workspace/")) {
    return normalizedPath;
  }

  return "/workspace";
}

