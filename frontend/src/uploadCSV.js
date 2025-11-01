import { supabase } from "./supabase";

export async function uploadCSV(file, userId) {
  const filePath = `datasets/${userId}/${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage
    .from("klyra")      //  bucket name
    .upload(filePath, file);

  if (error) {
    console.error(error);
    throw error;
  }

  const { data: publicUrlData } = supabase.storage
    .from("klyra")
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}