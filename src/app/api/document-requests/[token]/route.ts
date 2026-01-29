import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = createAdminClient();

    // Look up the document request by token
    const { data: docRequest, error: reqError } = await supabase
      .from("document_requests")
      .select(
        `
        id,
        status,
        expires_at,
        client_id,
        clients ( first_name )
      `
      )
      .eq("token", token)
      .single();

    if (reqError || !docRequest) {
      return NextResponse.json(
        { error: "Invalid or unknown upload link" },
        { status: 404 }
      );
    }

    // Check expiration
    if (new Date(docRequest.expires_at) < new Date()) {
      // Mark as expired if not already
      if (docRequest.status !== "expired") {
        await supabase
          .from("document_requests")
          .update({ status: "expired", updated_at: new Date().toISOString() })
          .eq("id", docRequest.id);
      }
      return NextResponse.json(
        { error: "This upload link has expired. Please contact Harvey & Co for a new link." },
        { status: 410 }
      );
    }

    // Fetch items
    const { data: items, error: itemsError } = await supabase
      .from("document_request_items")
      .select("id, name, description, status, uploaded_at, file_name, file_size")
      .eq("document_request_id", docRequest.id)
      .order("created_at", { ascending: true });

    if (itemsError) {
      console.error("Error fetching document request items:", itemsError);
      return NextResponse.json(
        { error: "Failed to load request details" },
        { status: 500 }
      );
    }

    const client = docRequest.clients as unknown as { first_name: string } | null;

    return NextResponse.json({
      id: docRequest.id,
      status: docRequest.status,
      expiresAt: docRequest.expires_at,
      clientFirstName: client?.first_name || "there",
      items: items || [],
    });
  } catch (error) {
    console.error("Error in document request GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
