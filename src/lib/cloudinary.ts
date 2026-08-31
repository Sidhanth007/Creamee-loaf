import "server-only";
import { createHash } from "node:crypto";

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

/** Uploads an image file to Cloudinary (signed) and returns its https URL. */
export async function uploadImage(
  file: File,
  folder: string
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { ok: false, error: "Please upload a JPG, PNG, WEBP or HEIC image." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Image must be under 5MB." };
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const toSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = createHash("sha1").update(toSign).digest("hex");

  const body = new FormData();
  body.append("file", file);
  body.append("api_key", apiKey);
  body.append("timestamp", timestamp);
  body.append("folder", folder);
  body.append("signature", signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body }
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error(`[cloudinary] upload failed (${res.status}): ${detail}`);
    return { ok: false, error: "Image upload failed. Please try again." };
  }
  const data = (await res.json()) as { secure_url: string };
  return { ok: true, url: data.secure_url };
}
