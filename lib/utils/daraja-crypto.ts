import fs from "fs";
import path from "path";
import crypto from "crypto";

export function encryptInitiatorPassword(password: string): string {
  const certPath = process.env.MPESA_CERT_PATH;
  if (!certPath) throw new Error("MPESA_CERT_PATH_MISSING");

  const cert = fs.readFileSync(path.resolve(certPath));
  const buffer = Buffer.from(password);

  return crypto.publicEncrypt(
    { key: cert, padding: crypto.constants.RSA_PKCS1_PADDING },
    buffer
  ).toString("base64");
}
