"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function uploadDocument(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const file = formData.get("file") as File;
  const clientId = formData.get("client_id") as string;
  const taxReturnId = formData.get("tax_return_id") as string || null;
  const category = formData.get("category") as string || null;

  if (!file || file.size === 0) {
    return { error: "No file provided" };
  }

  if (!clientId) {
    return { error: "Client is required" };
  }

  // Generate unique file path
  const fileExt = file.name.split(".").pop();
  const fileName = `${user.id}/${clientId}/${Date.now()}.${fileExt}`;

  // Upload file to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("client-documents")
    .upload(fileName, file);

  if (uploadError) {
    return { error: uploadError.message };
  }

  // Save document metadata to database
  const documentData = {
    client_id: clientId,
    tax_return_id: taxReturnId,
    name: file.name,
    file_path: fileName,
    mime_type: file.type,
    file_size: file.size,
    category: category,
    uploaded_by: user.id,
    user_id: user.id,
  };

  const { error: dbError } = await supabase.from("client-documents").insert(documentData);

  if (dbError) {
    // Clean up uploaded file if database insert fails
    await supabase.storage.from("client-documents").remove([fileName]);
    return { error: dbError.message };
  }

  revalidatePath("/dashboard/documents");
  if (clientId) {
    revalidatePath(`/dashboard/clients/${clientId}`);
  }

  return { success: true };
}

export async function deleteDocument(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get document to find file path
  const { data: document } = await supabase
    .from("client-documents")
    .select("file_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!document) {
    return { error: "Document not found" };
  }

  // Delete from storage
  await supabase.storage.from("client-documents").remove([document.file_path]);

  // Delete from database
  const { error } = await supabase
    .from("client-documents")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/documents");
  return { success: true };
}

export async function getDocumentUrl(filePath: string) {
  // Legacy Uploadcare CDN URLs are full URLs starting with http
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }

  // Supabase Storage paths - use admin client to bypass storage RLS
  // (intake-uploaded files have no user association)
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const adminSupabase = createAdminClient();

  const { data } = await adminSupabase.storage
    .from("client-documents")
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  return data?.signedUrl || null;
}
