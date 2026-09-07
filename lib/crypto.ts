import crypto from "crypto";

/**
 * Derives a 32-byte Buffer key from the environment variable TOKEN_ENCRYPTION_KEY.
 */
function getEncryptionKey(): Buffer {
  const rawKey = process.env.TOKEN_ENCRYPTION_KEY?.trim();

  if (!rawKey) {
    // Development fallback key (32 bytes / 64 hex chars)
    return Buffer.from("1ba536ddd660a9857855537eaa3769450b79b558c2f1c3e91a0a8fe0e53fba94", "hex");
  }

  if (rawKey.length === 64) {
    try {
      return Buffer.from(rawKey, "hex");
    } catch {
      // fallback to sha256 hash if hex decode fails
    }
  }

  // Hash any other string representation to exactly 32 bytes
  return crypto.createHash("sha256").update(rawKey).digest();
}

/**
 * Encrypts a token at rest using AES-256-GCM.
 * Output format: "ivHex:authTagHex:encryptedHex"
 */
export function encryptToken(token: string | null | undefined): string | null {
  if (!token) return null;

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(12); // 12-byte standard GCM IV
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

    let encrypted = cipher.update(token, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
  } catch (error) {
    console.error("Token encryption error:", error);
    throw new Error("Failed to encrypt OAuth token");
  }
}

/**
 * Decrypts an AES-256-GCM encrypted token.
 * Gracefully handles legacy unencrypted strings if encountered.
 */
export function decryptToken(cipherText: string | null | undefined): string | null {
  if (!cipherText) return null;

  // If not in "iv:authTag:encrypted" format, treat as unencrypted legacy token
  const parts = cipherText.split(":");
  if (parts.length !== 3) {
    return cipherText;
  }

  const [ivHex, authTagHex, encryptedHex] = parts;

  // Basic validation that hex parts are valid
  if (ivHex.length !== 24 || authTagHex.length !== 32) {
    return cipherText;
  }

  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Token decryption error (tag mismatch or corrupted data):", error);
    return null;
  }
}
