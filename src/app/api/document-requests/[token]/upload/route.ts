import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = createAdminClient();

    // Validate token and fetch request
    const { data: docRequest, error: reqError } = await supabase
      .from("document_requests")
      .select("id, status, expires_at, client_id, task_id")
      .eq("token", token)
      .single();

    if (reqError || !docRequest) {
      return NextResponse.json(
        { error: "Invalid upload link" },
        { status: 404 }
      );
    }

    if (new Date(docRequest.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This upload link has expired" },
        { status: 410 }
      );
    }

    if (docRequest.status === "expired") {
      return NextResponse.json(
        { error: "This upload link has expired" },
        { status: 410 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const itemId = formData.get("itemId") as string | null;

    if (!file || !itemId) {
      return NextResponse.json(
        { error: "Missing file or itemId" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `File type not allowed. Accepted: PDF, JPG, PNG, HEIC`,
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 25 MB." },
        { status: 400 }
      );
    }

    // Validate item belongs to this request
    const { data: item, error: itemError } = await supabase
      .from("document_request_items")
      .select("id, name, status")
      .eq("id", itemId)
      .eq("document_request_id", docRequest.id)
      .single();

    if (itemError || !item) {
      return NextResponse.json(
        { error: "Invalid item for this request" },
        { status: 400 }
      );
    }

    if (item.status === "uploaded") {
      return NextResponse.json(
        { error: "This document has already been uploaded" },
        { status: 409 }
      );
    }

    // Upload to Supabase Storage
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `document-requests/${docRequest.id}/${timestamp}-${sanitizedName}`;

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("client-documents")
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // Create documents row
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({
        client_id: docRequest.client_id,
        name: item.name,
        file_path: storagePath,
        mime_type: file.type,
        file_size: file.size,
        category: "other",
        user_id: null,
      })
      .select("id")
      .single();

    if (docError) {
      console.error("Error creating document record:", docError);
      return NextResponse.json(
        { error: "Failed to save document record" },
        { status: 500 }
      );
    }

    // Update the request item
    const now = new Date().toISOString();
    await supabase
      .from("document_request_items")
      .update({
        status: "uploaded",
        uploaded_at: now,
        document_id: doc.id,
        file_path: storagePath,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        updated_at: now,
      })
      .eq("id", itemId);

    // Check if all items are now uploaded
    const { data: allItems } = await supabase
      .from("document_request_items")
      .select("id, status")
      .eq("document_request_id", docRequest.id);

    const allComplete =
      allItems != null && allItems.every((i) => i.status === "uploaded");
    const someComplete =
      allItems != null && allItems.some((i) => i.status === "uploaded");

    // Update request status
    const newStatus = allComplete
      ? "completed"
      : someComplete
      ? "partially_uploaded"
      : "pending";

    await supabase
      .from("document_requests")
      .update({ status: newStatus, updated_at: now })
      .eq("id", docRequest.id);

    // Auto-complete task if all documents uploaded
    if (allComplete && docRequest.task_id) {
      await supabase
        .from("tasks")
        .update({
          status: "completed",
          completed_at: now,
          updated_at: now,
        })
        .eq("id", docRequest.task_id);
    }

    return NextResponse.json({
      success: true,
      itemId,
      fileName: file.name,
      fileSize: file.size,
      allComplete,
    });
  } catch (error) {
    console.error("Error in document upload:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
