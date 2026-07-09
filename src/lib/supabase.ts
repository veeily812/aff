import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "product-images";

function createServiceClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase env vars are not configured");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export async function uploadImage(
  file: File,
  path: string
): Promise<string> {
  const supabase = createServiceClient();
  const arrayBuffer = await file.arrayBuffer();

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteImage(path: string): Promise<void> {
  const supabase = createServiceClient();
  await supabase.storage.from(STORAGE_BUCKET).remove([path]);
}

export function storagePathFromPublicUrl(publicUrl: string): string | null {
  const marker = `/object/public/${STORAGE_BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  return index === -1 ? null : publicUrl.slice(index + marker.length);
}
