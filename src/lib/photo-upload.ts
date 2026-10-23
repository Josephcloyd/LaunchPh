import { getSupabaseBrowserClient } from "@/services/supabase-browser";

// Photos are resized in the browser before upload, so phone photos of several MB become a few
// hundred KB. That keeps pages fast and stays well inside the free storage tier.
const maxInputBytes = 25 * 1024 * 1024;

async function resize(file: File, maxEdge: number) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const encode = (type: string, quality: number) => new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, quality));
  // Older Safari can't encode WebP and quietly returns PNG, so fall back to JPEG.
  const webp = await encode("image/webp", 0.82);
  if (webp?.type === "image/webp") return { blob: webp, ext: "webp" as const };
  const jpeg = await encode("image/jpeg", 0.85);
  if (!jpeg) throw new Error("encode");
  return { blob: jpeg, ext: "jpg" as const };
}

export type UploadResult = { ok: true; path: string } | { ok: false; message: string };

/** Resizes and uploads one photo to the owner's folder; returns its storage path. */
export async function uploadPhoto(file: File, userId: string, maxEdge = 1600): Promise<UploadResult> {
  if (!file.type.startsWith("image/")) return { ok: false, message: "Choose a photo (JPG, PNG, or WebP)." };
  if (file.size > maxInputBytes) return { ok: false, message: "That photo is over 25 MB. Choose a smaller one." };
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, message: "Photo uploads aren’t available right now." };

  let resized;
  try {
    resized = await resize(file, maxEdge);
  } catch {
    return { ok: false, message: "That photo couldn’t be read. Try a JPG or PNG." };
  }
  const path = `${userId}/${crypto.randomUUID()}.${resized.ext}`;
  const { error } = await supabase.storage.from("site-photos").upload(path, resized.blob, {
    contentType: resized.ext === "webp" ? "image/webp" : "image/jpeg",
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) {
    return { ok: false, message: /row-level security|policy/i.test(error.message)
      ? "You’ve reached the limit of 150 photos. Remove photos you no longer use, then try again."
      : "The photo couldn’t be uploaded. Check your connection and try again." };
  }
  return { ok: true, path };
}
