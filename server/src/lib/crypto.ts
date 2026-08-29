import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { config } from "../config.js";
import { HttpError } from "./errors.js";

const VERSION = "v1";
const AAD = Buffer.from("relict-shell-credentials-v1", "utf8");

function encryptionKey(): Buffer {
  if (config.coreCredentialsSecret.length < 32) {
    throw new HttpError(
      503,
      "CORE_CREDENTIALS_SECRET must be configured with at least 32 characters",
    );
  }
  return createHash("sha256").update(config.coreCredentialsSecret, "utf8").digest();
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  cipher.setAAD(AAD);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptSecret(value: string): string {
  const [version, encodedIv, encodedTag, encodedCiphertext, ...rest] = value.split(".");
  if (version !== VERSION || !encodedIv || !encodedTag || !encodedCiphertext || rest.length) {
    throw new HttpError(500, "Stored credential has an invalid format");
  }

  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      Buffer.from(encodedIv, "base64url"),
    );
    decipher.setAAD(AAD);
    decipher.setAuthTag(Buffer.from(encodedTag, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(encodedCiphertext, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(500, "Stored credential could not be decrypted");
  }
}
