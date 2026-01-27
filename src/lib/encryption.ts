import { createHash, createCipheriv, createDecipheriv, randomBytes } from "crypto";

const getKey = () => {
  const key = process.env.SSN_ENCRYPTION_KEY || "default-key-change-in-production-32";
  return createHash("sha256").update(key).digest();
};

/**
 * Encrypt an SSN using AES-256-CBC
 * Returns format: iv:encryptedData (both hex encoded)
 */
export function encryptSSN(ssn: string): string {
  const keyBuffer = getKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", keyBuffer, iv);
  let encrypted = cipher.update(ssn.replace(/-/g, ""), "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Decrypt an SSN that was encrypted with encryptSSN
 * Input format: iv:encryptedData (both hex encoded)
 * Returns formatted SSN: XXX-XX-XXXX
 */
export function decryptSSN(encryptedSSN: string): string | null {
  try {
    if (!encryptedSSN || !encryptedSSN.includes(":")) {
      return null;
    }

    const [ivHex, encryptedHex] = encryptedSSN.split(":");
    if (!ivHex || !encryptedHex) {
      return null;
    }

    const keyBuffer = getKey();
    const iv = Buffer.from(ivHex, "hex");
    const decipher = createDecipheriv("aes-256-cbc", keyBuffer, iv);
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    // Format as XXX-XX-XXXX
    if (decrypted.length === 9) {
      return `${decrypted.slice(0, 3)}-${decrypted.slice(3, 5)}-${decrypted.slice(5)}`;
    }

    return decrypted;
  } catch (error) {
    console.error("Error decrypting SSN:", error);
    return null;
  }
}
